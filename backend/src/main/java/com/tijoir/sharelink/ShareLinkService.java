package com.tijoir.sharelink;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tijoir.audit.AuditAction;
import com.tijoir.audit.AuditEvent;
import com.tijoir.audit.AuditEventRepository;
import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.common.exception.ApiException;
import com.tijoir.common.util.CryptoUtil;
import com.tijoir.contract.ContractPermission;
import com.tijoir.organization.UserAccount;
import com.tijoir.organization.UserAccountRepository;
import com.tijoir.organization.UserRole;
import com.tijoir.secret.SecretPayloadStore;
import com.tijoir.secret.SecretStatus;
import com.tijoir.secret.SecretVersion;
import com.tijoir.secret.SecretVersionRepository;
import com.tijoir.secret.VaultSecret;
import com.tijoir.secret.VaultSecretRepository;
import com.tijoir.sharelink.dto.ConsumeShareLinkResponse;
import com.tijoir.sharelink.dto.CreateShareLinkRequest;
import com.tijoir.sharelink.dto.PublicShareLinkMetadataResponse;
import com.tijoir.sharelink.dto.ShareLinkResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ShareLinkService {
    private static final int TOKEN_BYTES = 24;

    private final ShareLinkRepository shareLinkRepository;
    private final VaultSecretRepository vaultSecretRepository;
    private final SecretVersionRepository secretVersionRepository;
    private final SecretPayloadStore secretPayloadStore;
    private final UserAccountRepository userAccountRepository;
    private final AuditEventRepository auditEventRepository;
    private final ObjectMapper objectMapper;

    public ShareLinkService(
            ShareLinkRepository shareLinkRepository,
            VaultSecretRepository vaultSecretRepository,
            SecretVersionRepository secretVersionRepository,
            SecretPayloadStore secretPayloadStore,
            UserAccountRepository userAccountRepository,
            AuditEventRepository auditEventRepository,
            ObjectMapper objectMapper
    ) {
        this.shareLinkRepository = shareLinkRepository;
        this.vaultSecretRepository = vaultSecretRepository;
        this.secretVersionRepository = secretVersionRepository;
        this.secretPayloadStore = secretPayloadStore;
        this.userAccountRepository = userAccountRepository;
        this.auditEventRepository = auditEventRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ShareLinkResponse create(AuthenticatedUser principal, CreateShareLinkRequest request) {
        requireShareManagerRole(principal.role());
        UserAccount actor = findActor(principal);
        VaultSecret secret = findSecret(principal.organizationId(), request.secretId());
        if (secret.getStatus() != SecretStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Share links can only be created for active secrets");
        }
        validateExpiry(request.expiresAt());

        String rawToken = CryptoUtil.randomUrlToken(TOKEN_BYTES);
        ShareLink shareLink = shareLinkRepository.save(new ShareLink(
                actor.getOrganization(),
                secret,
                actor,
                normalizeRecipientLabel(request.recipientLabel()),
                CryptoUtil.sha256Hex(rawToken),
                request.permission(),
                request.expiresAt()
        ));

        auditEventRepository.save(new AuditEvent(
                actor.getOrganization(),
                actor,
                AuditAction.SHARE_LINK_CREATED,
                "SHARE_LINK",
                shareLink.getId(),
                toJson(Map.of(
                        "secretId", secret.getId(),
                        "secretKey", secret.getSecretKey(),
                        "permission", request.permission().name()
                ))
        ));

        return toResponse(shareLink, rawToken, shareLink.getStatus());
    }

    @Transactional(readOnly = true)
    public List<ShareLinkResponse> list(AuthenticatedUser principal) {
        requireShareManagerRole(principal.role());
        Instant now = Instant.now();
        return shareLinkRepository.findAllByOrganizationIdOrderByCreatedAtDesc(principal.organizationId())
                .stream()
                .map(shareLink -> toResponse(shareLink, null, effectiveStatus(shareLink, now)))
                .toList();
    }

    @Transactional
    public ShareLinkResponse revoke(AuthenticatedUser principal, UUID shareLinkId) {
        requireShareManagerRole(principal.role());
        UserAccount actor = findActor(principal);
        ShareLink shareLink = findShareLink(principal.organizationId(), shareLinkId);
        expireIfNeeded(shareLink, Instant.now());

        if (shareLink.getStatus() == ShareLinkStatus.ACTIVE || shareLink.getStatus() == ShareLinkStatus.EXPIRED) {
            shareLink.revoke();
            auditEventRepository.save(new AuditEvent(
                    actor.getOrganization(),
                    actor,
                    AuditAction.SHARE_LINK_REVOKED,
                    "SHARE_LINK",
                    shareLink.getId(),
                    toJson(Map.of(
                            "secretId", shareLink.getSecret().getId(),
                            "secretKey", shareLink.getSecret().getSecretKey(),
                            "permission", shareLink.getContractPermission().name()
                    ))
            ));
        }

        return toResponse(shareLink, null, shareLink.getStatus());
    }

    @Transactional
    public PublicShareLinkMetadataResponse publicMetadata(String rawToken) {
        ShareLink shareLink = findShareLinkByToken(rawToken, false);
        Instant now = Instant.now();
        expireIfNeeded(shareLink, now);
        ShareLinkStatus status = effectiveStatus(shareLink, now);

        return new PublicShareLinkMetadataResponse(
                shareLink.getOrganization().getName(),
                shareLink.getSecret().getName(),
                shareLink.getSecret().getSecretType(),
                shareLink.getRecipientLabel(),
                shareLink.getContractPermission(),
                status,
                shareLink.getExpiresAt(),
                shareLink.getContractPermission() != ContractPermission.ROTATION_NOTIFY_ONLY
                        && status == ShareLinkStatus.ACTIVE
        );
    }

    @Transactional
    public ConsumeShareLinkResponse consume(String rawToken) {
        ShareLink shareLink = findShareLinkByToken(rawToken, true);
        Instant now = Instant.now();
        expireIfNeeded(shareLink, now);
        ensureConsumable(shareLink);

        VaultSecret secret = shareLink.getSecret();
        if (secret.getStatus() != SecretStatus.ACTIVE) {
            throw new ApiException(HttpStatus.GONE, "The underlying secret is no longer available");
        }

        SecretVersion version = secretVersionRepository.findBySecretIdAndVersionNumber(secret.getId(), secret.getCurrentVersionNumber())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Secret version not found"));

        if (shareLink.getContractPermission() == ContractPermission.VIEW_ONCE) {
            shareLink.consume();
        }

        auditEventRepository.save(new AuditEvent(
                shareLink.getOrganization(),
                null,
                AuditAction.SHARE_LINK_CONSUMED,
                "SHARE_LINK",
                shareLink.getId(),
                toJson(Map.of(
                        "secretId", secret.getId(),
                        "secretKey", secret.getSecretKey(),
                        "permission", shareLink.getContractPermission().name(),
                        "version", version.getVersionNumber(),
                        "publicAccess", true
                ))
        ));

        return new ConsumeShareLinkResponse(
                shareLink.getId(),
                secret.getName(),
                secret.getSecretKey(),
                secret.getSecretType(),
                version.getVersionNumber(),
                secretPayloadStore.reveal(version),
                shareLink.getContractPermission(),
                shareLink.getStatus()
        );
    }

    private UserAccount findActor(AuthenticatedUser principal) {
        return userAccountRepository.findById(principal.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
    }

    private VaultSecret findSecret(UUID organizationId, UUID secretId) {
        return vaultSecretRepository.findByIdAndOrganizationId(secretId, organizationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Secret not found"));
    }

    private ShareLink findShareLink(UUID organizationId, UUID shareLinkId) {
        return shareLinkRepository.findByIdAndOrganizationId(shareLinkId, organizationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Share link not found"));
    }

    private ShareLink findShareLinkByToken(String rawToken, boolean forUpdate) {
        String tokenHash = CryptoUtil.sha256Hex(rawToken);
        return (forUpdate ? shareLinkRepository.findByTokenHashForUpdate(tokenHash) : shareLinkRepository.findByTokenHash(tokenHash))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Share link not found"));
    }

    private void requireShareManagerRole(UserRole role) {
        if (role == UserRole.ORG_OWNER || role == UserRole.ADMIN || role == UserRole.MEMBER) {
            return;
        }
        throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to manage share links");
    }

    private void validateExpiry(Instant expiresAt) {
        if (expiresAt != null && !expiresAt.isAfter(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Share link expiry must be in the future");
        }
    }

    private String normalizeRecipientLabel(String recipientLabel) {
        if (recipientLabel == null || recipientLabel.isBlank()) {
            return null;
        }
        return recipientLabel.trim();
    }

    private void expireIfNeeded(ShareLink shareLink, Instant now) {
        if (shareLink.getStatus() == ShareLinkStatus.ACTIVE && shareLink.isExpiredAt(now)) {
            shareLink.expire();
        }
    }

    private ShareLinkStatus effectiveStatus(ShareLink shareLink, Instant now) {
        if (shareLink.getStatus() == ShareLinkStatus.ACTIVE && shareLink.isExpiredAt(now)) {
            return ShareLinkStatus.EXPIRED;
        }
        return shareLink.getStatus();
    }

    private void ensureConsumable(ShareLink shareLink) {
        if (shareLink.getStatus() == ShareLinkStatus.REVOKED) {
            throw new ApiException(HttpStatus.GONE, "Share link has been revoked");
        }
        if (shareLink.getStatus() == ShareLinkStatus.CONSUMED) {
            throw new ApiException(HttpStatus.GONE, "Share link has already been consumed");
        }
        if (shareLink.getStatus() == ShareLinkStatus.EXPIRED) {
            throw new ApiException(HttpStatus.GONE, "Share link has expired");
        }
        if (shareLink.getContractPermission() == ContractPermission.ROTATION_NOTIFY_ONLY) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This share link does not permit secret reveal");
        }
    }

    private ShareLinkResponse toResponse(ShareLink shareLink, String rawToken, ShareLinkStatus status) {
        return new ShareLinkResponse(
                shareLink.getId(),
                shareLink.getSecret().getId(),
                shareLink.getSecret().getName(),
                shareLink.getSecret().getSecretKey(),
                shareLink.getSecret().getSecretType(),
                shareLink.getRecipientLabel(),
                shareLink.getContractPermission(),
                status,
                shareLink.getExpiresAt(),
                shareLink.getConsumedAt(),
                shareLink.getCreatedAt(),
                rawToken,
                rawToken == null ? null : "/api/public/share-links/%s".formatted(rawToken),
                rawToken == null ? null : "/api/public/share-links/%s/consume".formatted(rawToken)
        );
    }

    private String toJson(Map<String, Object> details) {
        try {
            return objectMapper.writeValueAsString(details);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not serialize audit details", ex);
        }
    }
}

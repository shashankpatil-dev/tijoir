package com.tijoir.sharelink;

import com.tijoir.common.exception.ApiException;
import com.tijoir.common.util.CryptoUtil;
import com.tijoir.contract.ContractPermission;
import com.tijoir.secret.SecretPayloadStore;
import com.tijoir.sharelink.dto.ConsumeShareLinkResponse;
import com.tijoir.sharelink.dto.CreatePublicSecretShareRequest;
import com.tijoir.sharelink.dto.CreatePublicSecretShareResponse;
import com.tijoir.sharelink.dto.PublicSecretShareManagementResponse;
import com.tijoir.sharelink.dto.PublicShareLinkMetadataResponse;
import com.tijoir.sharelink.dto.RevokePublicSecretShareResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class PublicSecretDropService {
    private static final int TOKEN_BYTES = 24;
    private static final long DEFAULT_TTL_SECONDS = 24 * 60 * 60L;
    private static final long MAX_TTL_SECONDS = 7 * 24 * 60 * 60L;

    private final PublicSecretDropRepository publicSecretDropRepository;
    private final PublicSecretPayloadStore publicSecretPayloadStore;
    private final ShareLinkConsumeGuard shareLinkConsumeGuard;

    public PublicSecretDropService(
            PublicSecretDropRepository publicSecretDropRepository,
            PublicSecretPayloadStore publicSecretPayloadStore,
            ShareLinkConsumeGuard shareLinkConsumeGuard
    ) {
        this.publicSecretDropRepository = publicSecretDropRepository;
        this.publicSecretPayloadStore = publicSecretPayloadStore;
        this.shareLinkConsumeGuard = shareLinkConsumeGuard;
    }

    @Transactional
    public CreatePublicSecretShareResponse create(CreatePublicSecretShareRequest request) {
        String rawToken = CryptoUtil.randomUrlToken(TOKEN_BYTES);
        String rawManageToken = CryptoUtil.randomUrlToken(TOKEN_BYTES);
        PublicSecretDrop drop = new PublicSecretDrop(
                CryptoUtil.sha256Hex(rawToken),
                CryptoUtil.sha256Hex(rawManageToken),
                request.secretName().trim(),
                request.secretKey().trim(),
                request.secretType(),
                normalize(request.senderLabel()),
                normalize(request.recipientLabel()),
                resolveExpiry(request.expiresAt())
        );
        SecretPayloadStore.StoredPayload payload = publicSecretPayloadStore.store(drop, request.value());
        drop.storePayload(payload.backend(), payload.payloadRef(), payload.payloadCiphertext());
        publicSecretDropRepository.save(drop);
        return new CreatePublicSecretShareResponse(
                drop.getId(),
                rawToken,
                rawManageToken,
                "/access?token=%s".formatted(rawToken),
                "/api/public/share-links/%s".formatted(rawToken),
                "/api/public/share-links/%s/consume".formatted(rawToken),
                "/api/public/share-links/manage/%s/revoke".formatted(rawManageToken),
                drop.getExpiresAt()
        );
    }

    @Transactional
    public PublicShareLinkMetadataResponse metadata(String rawToken) {
        PublicSecretDrop drop = findByToken(rawToken, false);
        Instant now = Instant.now();
        expireIfNeeded(drop, now);
        ShareLinkStatus status = effectiveStatus(drop, now);
        return new PublicShareLinkMetadataResponse(
                senderName(drop),
                null,
                drop.getSecretName(),
                drop.getSecretType(),
                drop.getRecipientLabel(),
                ContractPermission.VIEW_ONCE,
                status,
                drop.getExpiresAt(),
                status == ShareLinkStatus.ACTIVE,
                PublicShareSourceType.ANONYMOUS
        );
    }

    @Transactional
    public ConsumeShareLinkResponse consume(String rawToken) {
        String tokenHash = CryptoUtil.sha256Hex(rawToken);
        try (ShareLinkConsumeGuard.GuardLease ignored = shareLinkConsumeGuard.acquire(tokenHash)) {
            PublicSecretDrop drop = findByTokenHash(tokenHash, true);
            Instant now = Instant.now();
            expireIfNeeded(drop, now);
            ensureConsumable(drop);
            drop.consume();
            return new ConsumeShareLinkResponse(
                    drop.getId(),
                    drop.getSecretName(),
                    drop.getSecretKey(),
                    drop.getSecretType(),
                    1,
                    publicSecretPayloadStore.reveal(drop),
                    ContractPermission.VIEW_ONCE,
                    drop.getStatus(),
                    PublicShareSourceType.ANONYMOUS
            );
        }
    }

    @Transactional
    public RevokePublicSecretShareResponse revoke(String rawManageToken) {
        PublicSecretDrop drop = findByManageToken(rawManageToken, true);
        Instant now = Instant.now();
        expireIfNeeded(drop, now);

        if (drop.getStatus() == ShareLinkStatus.ACTIVE) {
            drop.revoke();
        } else if (drop.getStatus() == ShareLinkStatus.CONSUMED) {
            throw new ApiException(HttpStatus.GONE, "Share link has already been consumed");
        } else if (drop.getStatus() == ShareLinkStatus.EXPIRED) {
            throw new ApiException(HttpStatus.GONE, "Share link has expired");
        }

        return new RevokePublicSecretShareResponse(
                drop.getId(),
                drop.getStatus(),
                drop.getExpiresAt(),
                drop.getConsumedAt()
        );
    }

    @Transactional
    public PublicSecretShareManagementResponse management(String rawManageToken) {
        PublicSecretDrop drop = findByManageToken(rawManageToken, false);
        Instant now = Instant.now();
        expireIfNeeded(drop, now);
        ShareLinkStatus status = effectiveStatus(drop, now);
        return new PublicSecretShareManagementResponse(
                drop.getId(),
                senderName(drop),
                drop.getSecretName(),
                drop.getSecretKey(),
                status,
                drop.getExpiresAt(),
                drop.getConsumedAt(),
                status == ShareLinkStatus.ACTIVE
        );
    }

    private PublicSecretDrop findByToken(String rawToken, boolean forUpdate) {
        return findByTokenHash(CryptoUtil.sha256Hex(rawToken), forUpdate);
    }

    private PublicSecretDrop findByManageToken(String rawManageToken, boolean forUpdate) {
        return findByManageTokenHash(CryptoUtil.sha256Hex(rawManageToken), forUpdate);
    }

    private PublicSecretDrop findByTokenHash(String tokenHash, boolean forUpdate) {
        return (forUpdate
                ? publicSecretDropRepository.findByTokenHashForUpdate(tokenHash)
                : publicSecretDropRepository.findByTokenHash(tokenHash))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Share link not found"));
    }

    private PublicSecretDrop findByManageTokenHash(String manageTokenHash, boolean forUpdate) {
        return (forUpdate
                ? publicSecretDropRepository.findByManageTokenHashForUpdate(manageTokenHash)
                : publicSecretDropRepository.findByManageTokenHash(manageTokenHash))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Share link not found"));
    }

    private Instant resolveExpiry(Instant requestedExpiry) {
        Instant now = Instant.now();
        Instant effectiveExpiry = requestedExpiry == null ? now.plusSeconds(DEFAULT_TTL_SECONDS) : requestedExpiry;
        if (!effectiveExpiry.isAfter(now)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Share link expiry must be in the future");
        }
        if (effectiveExpiry.isAfter(now.plusSeconds(MAX_TTL_SECONDS))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Public quick-share links cannot exceed 7 days");
        }
        return effectiveExpiry;
    }

    private void expireIfNeeded(PublicSecretDrop drop, Instant now) {
        if (drop.getStatus() == ShareLinkStatus.ACTIVE && drop.isExpiredAt(now)) {
            drop.expire();
        }
    }

    private ShareLinkStatus effectiveStatus(PublicSecretDrop drop, Instant now) {
        if (drop.getStatus() == ShareLinkStatus.ACTIVE && drop.isExpiredAt(now)) {
            return ShareLinkStatus.EXPIRED;
        }
        return drop.getStatus();
    }

    private void ensureConsumable(PublicSecretDrop drop) {
        if (drop.getStatus() == ShareLinkStatus.CONSUMED) {
            throw new ApiException(HttpStatus.GONE, "Share link has already been consumed");
        }
        if (drop.getStatus() == ShareLinkStatus.EXPIRED) {
            throw new ApiException(HttpStatus.GONE, "Share link has expired");
        }
        if (drop.getStatus() == ShareLinkStatus.REVOKED) {
            throw new ApiException(HttpStatus.GONE, "Share link has been revoked");
        }
    }

    private String senderName(PublicSecretDrop drop) {
        if (drop.getSenderLabel() == null || drop.getSenderLabel().isBlank()) {
            return "Anonymous sender";
        }
        return drop.getSenderLabel();
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}

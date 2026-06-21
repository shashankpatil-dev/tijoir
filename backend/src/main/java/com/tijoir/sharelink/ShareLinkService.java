package com.tijoir.sharelink;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tijoir.audit.AuditAction;
import com.tijoir.audit.AuditEvent;
import com.tijoir.audit.AuditEventRepository;
import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.connection.Vendor;
import com.tijoir.connection.VendorAccessContract;
import com.tijoir.connection.VendorAccessContractRepository;
import com.tijoir.connection.VendorAccessContractStatus;
import com.tijoir.connection.VendorRepository;
import com.tijoir.connection.VendorStatus;
import com.tijoir.common.exception.ApiException;
import com.tijoir.common.paging.PageRequestFactory;
import com.tijoir.common.paging.PageResponse;
import com.tijoir.common.util.CryptoUtil;
import com.tijoir.contract.ContractPermission;
import com.tijoir.organization.OrganizationPolicyCacheService;
import com.tijoir.organization.dto.OrganizationPolicyResponse;
import com.tijoir.organization.OrganizationAuthorizationService;
import com.tijoir.organization.UserAccount;
import com.tijoir.organization.UserAccountRepository;
import com.tijoir.dashboard.DashboardSummaryService;
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
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
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
    private final VendorRepository vendorRepository;
    private final VendorAccessContractRepository vendorAccessContractRepository;
    private final OrganizationPolicyCacheService organizationPolicyCacheService;
    private final OrganizationAuthorizationService authorizationService;
    private final AuditEventRepository auditEventRepository;
    private final ObjectMapper objectMapper;
    private final ShareLinkConsumeGuard shareLinkConsumeGuard;
    private final DashboardSummaryService dashboardSummaryService;

    public ShareLinkService(
            ShareLinkRepository shareLinkRepository,
            VaultSecretRepository vaultSecretRepository,
            SecretVersionRepository secretVersionRepository,
            SecretPayloadStore secretPayloadStore,
            UserAccountRepository userAccountRepository,
            VendorRepository vendorRepository,
            VendorAccessContractRepository vendorAccessContractRepository,
            OrganizationPolicyCacheService organizationPolicyCacheService,
            OrganizationAuthorizationService authorizationService,
            AuditEventRepository auditEventRepository,
            ObjectMapper objectMapper,
            ShareLinkConsumeGuard shareLinkConsumeGuard,
            DashboardSummaryService dashboardSummaryService
    ) {
        this.shareLinkRepository = shareLinkRepository;
        this.vaultSecretRepository = vaultSecretRepository;
        this.secretVersionRepository = secretVersionRepository;
        this.secretPayloadStore = secretPayloadStore;
        this.userAccountRepository = userAccountRepository;
        this.vendorRepository = vendorRepository;
        this.vendorAccessContractRepository = vendorAccessContractRepository;
        this.organizationPolicyCacheService = organizationPolicyCacheService;
        this.authorizationService = authorizationService;
        this.auditEventRepository = auditEventRepository;
        this.objectMapper = objectMapper;
        this.shareLinkConsumeGuard = shareLinkConsumeGuard;
        this.dashboardSummaryService = dashboardSummaryService;
    }

    @Transactional
    public ShareLinkResponse create(AuthenticatedUser principal, CreateShareLinkRequest request) {
        authorizationService.requireShareManager(principal.role());
        UserAccount actor = findActor(principal);
        VaultSecret secret = findSecret(principal.organizationId(), request.secretId());
        if (secret.getStatus() != SecretStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Share links can only be created for active secrets");
        }
        Vendor vendor = resolveVendor(principal.organizationId(), request.vendorId(), request.contractId());
        VendorAccessContract contract = resolveContract(principal.organizationId(), request.contractId(), vendor);
        OrganizationPolicyResponse policy = effectivePolicy(principal.organizationId());
        validatePolicy(policy, request.permission(), vendor, contract);
        validateContractAlignment(secret, request.permission(), vendor, contract);
        Instant expiresAt = effectiveExpiry(request.expiresAt(), contract, policy);
        validateExpiry(expiresAt);

        String rawToken = CryptoUtil.randomUrlToken(TOKEN_BYTES);
        ShareLink shareLink = shareLinkRepository.save(new ShareLink(
                actor.getOrganization(),
                secret,
                actor,
                vendor,
                contract,
                normalizeRecipientLabel(request.recipientLabel()),
                CryptoUtil.sha256Hex(rawToken),
                request.permission(),
                expiresAt
        ));

        Map<String, Object> auditDetails = new LinkedHashMap<>();
        auditDetails.put("secretId", secret.getId());
        auditDetails.put("secretKey", secret.getSecretKey());
        auditDetails.put("permission", request.permission().name());
        auditDetails.put("vendorId", vendor != null ? vendor.getId() : null);
        auditDetails.put("contractId", contract != null ? contract.getId() : null);

        auditEventRepository.save(new AuditEvent(
                actor.getOrganization(),
                actor,
                AuditAction.SHARE_LINK_CREATED,
                "SHARE_LINK",
                shareLink.getId(),
                toJson(auditDetails)
        ));

        dashboardSummaryService.evict(principal.organizationId());
        return toResponse(shareLink, rawToken, shareLink.getStatus());
    }

    @Transactional(readOnly = true)
    public PageResponse<ShareLinkResponse> list(
            AuthenticatedUser principal,
            Integer page,
            Integer size,
            String query,
            ContractPermission permission,
            ShareLinkStatus status
    ) {
        authorizationService.requireShareManager(principal.role());
        Instant now = Instant.now();
        PageRequest pageRequest = PageRequestFactory.create(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ShareLinkResponse> results = shareLinkRepository.findAll(
                        shareLinkListSpec(principal.organizationId(), query, permission, status, now),
                        pageRequest
                )
                .map(shareLink -> toResponse(shareLink, null, effectiveStatus(shareLink, now)));
        return PageResponse.from(results);
    }

    @Transactional
    public ShareLinkResponse revoke(AuthenticatedUser principal, UUID shareLinkId) {
        authorizationService.requireShareManager(principal.role());
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
            dashboardSummaryService.evict(principal.organizationId());
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
        String tokenHash = CryptoUtil.sha256Hex(rawToken);
        try (ShareLinkConsumeGuard.GuardLease ignored = shareLinkConsumeGuard.acquire(tokenHash)) {
            ShareLink shareLink = findShareLinkByTokenHash(tokenHash, true);
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
                dashboardSummaryService.evict(shareLink.getOrganization().getId());
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
    }

    private UserAccount findActor(AuthenticatedUser principal) {
        return authorizationService.requireActor(principal);
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
        return findShareLinkByTokenHash(CryptoUtil.sha256Hex(rawToken), forUpdate);
    }

    private ShareLink findShareLinkByTokenHash(String tokenHash, boolean forUpdate) {
        return (forUpdate ? shareLinkRepository.findByTokenHashForUpdate(tokenHash) : shareLinkRepository.findByTokenHash(tokenHash))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Share link not found"));
    }

    private void validateExpiry(Instant expiresAt) {
        if (expiresAt != null && !expiresAt.isAfter(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Share link expiry must be in the future");
        }
    }

    private Vendor resolveVendor(UUID organizationId, UUID vendorId, UUID contractId) {
        if (vendorId == null && contractId == null) {
            return null;
        }
        if (vendorId == null) {
            VendorAccessContract contract = vendorAccessContractRepository.findByIdAndOrganizationId(contractId, organizationId)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor contract not found"));
            if (contract.getVendor().getStatus() != VendorStatus.ACTIVE) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Vendor has already been offboarded");
            }
            return contract.getVendor();
        }
        Vendor vendor = vendorRepository.findByIdAndOrganizationId(vendorId, organizationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found"));
        if (vendor.getStatus() != VendorStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vendor has already been offboarded");
        }
        return vendor;
    }

    private VendorAccessContract resolveContract(UUID organizationId, UUID contractId, Vendor vendor) {
        if (contractId == null) {
            return null;
        }
        VendorAccessContract contract = vendorAccessContractRepository.findByIdAndOrganizationId(contractId, organizationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor contract not found"));
        expireContractIfNeeded(contract, Instant.now());
        if (contract.getStatus() != VendorAccessContractStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Share links can only be created for active vendor contracts");
        }
        if (vendor != null && !contract.getVendor().getId().equals(vendor.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vendor contract does not belong to the selected vendor");
        }
        return contract;
    }

    private void validateContractAlignment(
            VaultSecret secret,
            ContractPermission permission,
            Vendor vendor,
            VendorAccessContract contract
    ) {
        if (contract == null) {
            return;
        }
        if (!contract.getSecret().getId().equals(secret.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Share link secret must match the vendor contract secret");
        }
        if (contract.getContractPermission() != permission) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Share link permission must match the vendor contract permission");
        }
        if (vendor != null && !contract.getVendor().getId().equals(vendor.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Share link vendor must match the vendor contract vendor");
        }
    }

    private OrganizationPolicyResponse effectivePolicy(UUID organizationId) {
        return organizationPolicyCacheService.getPolicyResponse(organizationId);
    }

    private void validatePolicy(
            OrganizationPolicyResponse policy,
            ContractPermission permission,
            Vendor vendor,
            VendorAccessContract contract
    ) {
        if (policy == null) {
            return;
        }
        if (policy.requireVendorContractForShareLinks() && contract == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Organization policy requires an active vendor contract for share links");
        }
        if (vendor != null && policy.requireVendorContractForShareLinks() && contract == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Organization policy requires an active vendor contract for vendor share links");
        }
        if (permission == ContractPermission.VIEW_ONCE && !policy.allowViewOnce()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Organization policy does not allow VIEW_ONCE share links");
        }
        if (permission == ContractPermission.VIEW_UNTIL_REVOKED && !policy.allowViewUntilRevoked()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Organization policy does not allow VIEW_UNTIL_REVOKED share links");
        }
        if (permission == ContractPermission.ROTATION_NOTIFY_ONLY && !policy.allowRotationNotifyOnly()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Organization policy does not allow ROTATION_NOTIFY_ONLY share links");
        }
    }

    private Instant effectiveExpiry(
            Instant requestedExpiry,
            VendorAccessContract contract,
            OrganizationPolicyResponse policy
    ) {
        Instant effectiveRequestedExpiry = requestedExpiry;
        if (effectiveRequestedExpiry == null && policy != null && policy.defaultShareLinkExpiryHours() != null) {
            effectiveRequestedExpiry = Instant.now().plusSeconds(policy.defaultShareLinkExpiryHours() * 60L * 60L);
        }
        if (contract == null) {
            return effectiveRequestedExpiry;
        }
        if (effectiveRequestedExpiry == null) {
            return contract.getExpiresAt();
        }
        if (contract.getExpiresAt() != null && effectiveRequestedExpiry.isAfter(contract.getExpiresAt())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Share link expiry cannot exceed the vendor contract expiry");
        }
        return effectiveRequestedExpiry;
    }

    private void expireContractIfNeeded(VendorAccessContract contract, Instant now) {
        if (contract.getStatus() == VendorAccessContractStatus.ACTIVE && contract.isExpiredAt(now)) {
            contract.expire();
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
                shareLink.getVendor() != null ? shareLink.getVendor().getId() : null,
                shareLink.getVendor() != null ? shareLink.getVendor().getName() : null,
                shareLink.getContract() != null ? shareLink.getContract().getId() : null,
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

    private Specification<ShareLink> shareLinkListSpec(
            UUID organizationId,
            String query,
            ContractPermission permission,
            ShareLinkStatus status,
            Instant now
    ) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            Predicate predicate = criteriaBuilder.equal(root.get("organization").get("id"), organizationId);

            if (query != null && !query.isBlank()) {
                String pattern = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
                var secretJoin = root.join("secret", JoinType.INNER);
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("recipientLabel"), "")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(secretJoin.get("name")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(secretJoin.get("secretKey")), pattern)
                ));
            }
            if (permission != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("contractPermission"), permission));
            }
            if (status != null) {
                predicate = criteriaBuilder.and(predicate, statusPredicate(root, criteriaBuilder, status, now));
            }
            return predicate;
        };
    }

    private Predicate statusPredicate(
            jakarta.persistence.criteria.Root<ShareLink> root,
            jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
            ShareLinkStatus status,
            Instant now
    ) {
        return switch (status) {
            case ACTIVE -> criteriaBuilder.and(
                    criteriaBuilder.equal(root.get("status"), ShareLinkStatus.ACTIVE),
                    criteriaBuilder.or(
                            criteriaBuilder.isNull(root.get("expiresAt")),
                            criteriaBuilder.greaterThan(root.get("expiresAt"), now)
                    )
            );
            case EXPIRED -> criteriaBuilder.or(
                    criteriaBuilder.equal(root.get("status"), ShareLinkStatus.EXPIRED),
                    criteriaBuilder.and(
                            criteriaBuilder.equal(root.get("status"), ShareLinkStatus.ACTIVE),
                            criteriaBuilder.isNotNull(root.get("expiresAt")),
                            criteriaBuilder.lessThanOrEqualTo(root.get("expiresAt"), now)
                    )
            );
            case CONSUMED, REVOKED -> criteriaBuilder.equal(root.get("status"), status);
        };
    }
}

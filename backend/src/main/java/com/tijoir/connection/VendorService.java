package com.tijoir.connection;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tijoir.audit.AuditAction;
import com.tijoir.audit.AuditEvent;
import com.tijoir.audit.AuditEventRepository;
import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.common.exception.ApiException;
import com.tijoir.common.paging.PageRequestFactory;
import com.tijoir.common.paging.PageResponse;
import com.tijoir.connection.dto.CreateVendorContractRequest;
import com.tijoir.connection.dto.CreateVendorRequest;
import com.tijoir.connection.dto.OffboardVendorResponse;
import com.tijoir.connection.dto.VendorContractResponse;
import com.tijoir.connection.dto.VendorResponse;
import com.tijoir.contract.ContractPermission;
import com.tijoir.organization.OrganizationAuthorizationService;
import com.tijoir.organization.UserAccount;
import com.tijoir.dashboard.DashboardSummaryService;
import com.tijoir.secret.SecretStatus;
import com.tijoir.secret.VaultSecret;
import com.tijoir.secret.VaultSecretRepository;
import com.tijoir.sharelink.ShareLink;
import com.tijoir.sharelink.ShareLinkRepository;
import com.tijoir.sharelink.ShareLinkStatus;
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
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class VendorService {
    private final VendorRepository vendorRepository;
    private final VendorAccessContractRepository vendorAccessContractRepository;
    private final VaultSecretRepository vaultSecretRepository;
    private final ShareLinkRepository shareLinkRepository;
    private final OrganizationAuthorizationService authorizationService;
    private final AuditEventRepository auditEventRepository;
    private final DashboardSummaryService dashboardSummaryService;
    private final ObjectMapper objectMapper;

    public VendorService(
            VendorRepository vendorRepository,
            VendorAccessContractRepository vendorAccessContractRepository,
            VaultSecretRepository vaultSecretRepository,
            ShareLinkRepository shareLinkRepository,
            OrganizationAuthorizationService authorizationService,
            AuditEventRepository auditEventRepository,
            DashboardSummaryService dashboardSummaryService,
            ObjectMapper objectMapper
    ) {
        this.vendorRepository = vendorRepository;
        this.vendorAccessContractRepository = vendorAccessContractRepository;
        this.vaultSecretRepository = vaultSecretRepository;
        this.shareLinkRepository = shareLinkRepository;
        this.authorizationService = authorizationService;
        this.auditEventRepository = auditEventRepository;
        this.dashboardSummaryService = dashboardSummaryService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public PageResponse<VendorResponse> list(
            AuthenticatedUser principal,
            Integer page,
            Integer size,
            String query,
            VendorStatus status
    ) {
        authorizationService.requireVendorManager(principal.role());
        PageRequest pageRequest = PageRequestFactory.create(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<VendorResponse> results = vendorRepository.findAll(vendorSpec(principal.organizationId(), query, status), pageRequest)
                .map(this::toVendorResponse);
        return PageResponse.from(results);
    }

    @Transactional
    public VendorResponse create(AuthenticatedUser principal, CreateVendorRequest request) {
        UserAccount actor = authorizationService.requireActor(principal);
        authorizationService.requireVendorManager(actor.getRole());

        Vendor vendor = vendorRepository.save(new Vendor(
                actor.getOrganization(),
                actor,
                request.name().trim(),
                normalizeOptional(request.contactName()),
                normalizeEmailOptional(request.contactEmail()),
                normalizeOptional(request.notes())
        ));

        Map<String, Object> auditDetails = new LinkedHashMap<>();
        auditDetails.put("name", vendor.getName());
        auditDetails.put("contactEmail", vendor.getContactEmail());

        auditEventRepository.save(new AuditEvent(
                actor.getOrganization(),
                actor,
                AuditAction.VENDOR_CREATED,
                "VENDOR",
                vendor.getId(),
                toJson(auditDetails)
        ));

        dashboardSummaryService.evict(principal.organizationId());
        return toVendorResponse(vendor);
    }

    @Transactional(readOnly = true)
    public VendorResponse get(AuthenticatedUser principal, UUID vendorId) {
        authorizationService.requireVendorManager(principal.role());
        return toVendorResponse(findVendor(principal.organizationId(), vendorId));
    }

    @Transactional(readOnly = true)
    public PageResponse<VendorContractResponse> listContracts(
            AuthenticatedUser principal,
            UUID vendorId,
            Integer page,
            Integer size,
            VendorAccessContractStatus status
    ) {
        authorizationService.requireVendorManager(principal.role());
        Vendor vendor = findVendor(principal.organizationId(), vendorId);
        Instant now = Instant.now();
        PageRequest pageRequest = PageRequestFactory.create(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<VendorContractResponse> results = vendorAccessContractRepository.findAll(contractSpec(principal.organizationId(), vendor.getId(), status, now), pageRequest)
                .map(contract -> toContractResponse(contract, effectiveContractStatus(contract, now)));
        return PageResponse.from(results);
    }

    @Transactional
    public VendorContractResponse createContract(
            AuthenticatedUser principal,
            UUID vendorId,
            CreateVendorContractRequest request
    ) {
        UserAccount actor = authorizationService.requireActor(principal);
        authorizationService.requireVendorManager(actor.getRole());

        Vendor vendor = findVendor(principal.organizationId(), vendorId);
        ensureVendorActive(vendor);

        VaultSecret secret = vaultSecretRepository.findByIdAndOrganizationId(request.secretId(), principal.organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Secret not found"));
        if (secret.getStatus() != SecretStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vendor contracts can only be created for active secrets");
        }
        validateExpiry(request.expiresAt());
        if (hasActiveContractForSecret(vendorId, secret.getId(), Instant.now())) {
            throw new ApiException(HttpStatus.CONFLICT, "An active contract already exists for this vendor and secret");
        }

        VendorAccessContract contract = vendorAccessContractRepository.save(new VendorAccessContract(
                actor.getOrganization(),
                vendor,
                secret,
                actor,
                request.permission(),
                request.expiresAt()
        ));

        auditEventRepository.save(new AuditEvent(
                actor.getOrganization(),
                actor,
                AuditAction.VENDOR_CONTRACT_CREATED,
                "VENDOR_ACCESS_CONTRACT",
                contract.getId(),
                toJson(Map.of(
                        "vendorId", vendor.getId(),
                        "secretId", secret.getId(),
                        "secretKey", secret.getSecretKey(),
                        "permission", request.permission().name()
                ))
        ));

        return toContractResponse(contract, contract.getStatus());
    }

    @Transactional
    public VendorContractResponse revokeContract(AuthenticatedUser principal, UUID vendorId, UUID contractId) {
        UserAccount actor = authorizationService.requireActor(principal);
        authorizationService.requireVendorManager(actor.getRole());

        Vendor vendor = findVendor(principal.organizationId(), vendorId);
        VendorAccessContract contract = vendorAccessContractRepository.findByIdAndOrganizationId(contractId, principal.organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor contract not found"));
        if (!contract.getVendor().getId().equals(vendor.getId())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Vendor contract not found");
        }

        expireContractIfNeeded(contract, Instant.now());
        if (contract.getStatus() == VendorAccessContractStatus.ACTIVE) {
            contract.revoke();
            auditEventRepository.save(new AuditEvent(
                    actor.getOrganization(),
                    actor,
                    AuditAction.VENDOR_CONTRACT_REVOKED,
                    "VENDOR_ACCESS_CONTRACT",
                    contract.getId(),
                    toJson(Map.of(
                            "vendorId", vendor.getId(),
                            "secretId", contract.getSecret().getId(),
                            "secretKey", contract.getSecret().getSecretKey(),
                            "permission", contract.getContractPermission().name()
                    ))
            ));
        }

        return toContractResponse(contract, effectiveContractStatus(contract, Instant.now()));
    }

    @Transactional
    public OffboardVendorResponse offboard(AuthenticatedUser principal, UUID vendorId) {
        UserAccount actor = authorizationService.requireActor(principal);
        authorizationService.requireVendorManager(actor.getRole());

        Vendor vendor = findVendor(principal.organizationId(), vendorId);
        Instant now = Instant.now();

        int revokedContracts = 0;
        for (VendorAccessContract contract : vendorAccessContractRepository.findAllByVendorIdAndStatus(vendorId, VendorAccessContractStatus.ACTIVE)) {
            expireContractIfNeeded(contract, now);
            if (contract.getStatus() == VendorAccessContractStatus.ACTIVE) {
                contract.revoke();
                revokedContracts++;
            }
        }

        int revokedShareLinks = 0;
        for (ShareLink shareLink : shareLinkRepository.findAllActiveByVendorId(vendorId, List.of(ShareLinkStatus.ACTIVE))) {
            if (shareLink.getStatus() == ShareLinkStatus.ACTIVE) {
                shareLink.revoke();
                revokedShareLinks++;
            }
        }

        vendor.offboard();

        auditEventRepository.save(new AuditEvent(
                actor.getOrganization(),
                actor,
                AuditAction.VENDOR_OFFBOARDED,
                "VENDOR",
                vendor.getId(),
                toJson(Map.of(
                        "vendorName", vendor.getName(),
                        "revokedContracts", revokedContracts,
                        "revokedShareLinks", revokedShareLinks
                ))
        ));

        dashboardSummaryService.evict(principal.organizationId());
        return new OffboardVendorResponse(
                vendor.getId(),
                vendor.getName(),
                revokedContracts,
                revokedShareLinks,
                vendor.getStatus() == VendorStatus.OFFBOARDED
        );
    }

    private Vendor findVendor(UUID organizationId, UUID vendorId) {
        return vendorRepository.findByIdAndOrganizationId(vendorId, organizationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor not found"));
    }

    private void ensureVendorActive(Vendor vendor) {
        if (vendor.getStatus() != VendorStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vendor has already been offboarded");
        }
    }

    private void validateExpiry(Instant expiresAt) {
        if (expiresAt != null && !expiresAt.isAfter(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Contract expiry must be in the future");
        }
    }

    private boolean hasActiveContractForSecret(UUID vendorId, UUID secretId, Instant now) {
        for (VendorAccessContract contract : vendorAccessContractRepository.findAllByVendorIdAndStatus(vendorId, VendorAccessContractStatus.ACTIVE)) {
            expireContractIfNeeded(contract, now);
            if (contract.getStatus() == VendorAccessContractStatus.ACTIVE
                    && contract.getSecret().getId().equals(secretId)) {
                return true;
            }
        }
        return false;
    }

    private void expireContractIfNeeded(VendorAccessContract contract, Instant now) {
        if (contract.getStatus() == VendorAccessContractStatus.ACTIVE && contract.isExpiredAt(now)) {
            contract.expire();
        }
    }

    private VendorAccessContractStatus effectiveContractStatus(VendorAccessContract contract, Instant now) {
        if (contract.getStatus() == VendorAccessContractStatus.ACTIVE && contract.isExpiredAt(now)) {
            return VendorAccessContractStatus.EXPIRED;
        }
        return contract.getStatus();
    }

    private VendorResponse toVendorResponse(Vendor vendor) {
        return new VendorResponse(
                vendor.getId(),
                vendor.getName(),
                vendor.getContactName(),
                vendor.getContactEmail(),
                vendor.getNotes(),
                vendor.getStatus(),
                vendor.getCreatedBy().getName(),
                vendor.getOffboardedAt(),
                vendor.getCreatedAt()
        );
    }

    private VendorContractResponse toContractResponse(VendorAccessContract contract, VendorAccessContractStatus status) {
        return new VendorContractResponse(
                contract.getId(),
                contract.getVendor().getId(),
                contract.getVendor().getName(),
                contract.getSecret().getId(),
                contract.getSecret().getName(),
                contract.getSecret().getSecretKey(),
                contract.getSecret().getSecretType(),
                contract.getContractPermission(),
                status,
                contract.getExpiresAt(),
                contract.getRevokedAt(),
                contract.getCreatedAt()
        );
    }

    private Specification<Vendor> vendorSpec(UUID organizationId, String query, VendorStatus status) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            Predicate predicate = criteriaBuilder.equal(root.get("organization").get("id"), organizationId);
            if (query != null && !query.isBlank()) {
                String pattern = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("contactName"), "")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("contactEmail"), "")), pattern)
                ));
            }
            if (status != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("status"), status));
            }
            return predicate;
        };
    }

    private Specification<VendorAccessContract> contractSpec(
            UUID organizationId,
            UUID vendorId,
            VendorAccessContractStatus status,
            Instant now
    ) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            Predicate predicate = criteriaBuilder.equal(root.get("organization").get("id"), organizationId);
            predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("vendor").get("id"), vendorId));
            if (status != null) {
                predicate = criteriaBuilder.and(predicate, contractStatusPredicate(root, criteriaBuilder, status, now));
            }
            return predicate;
        };
    }

    private Predicate contractStatusPredicate(
            jakarta.persistence.criteria.Root<VendorAccessContract> root,
            jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
            VendorAccessContractStatus status,
            Instant now
    ) {
        return switch (status) {
            case ACTIVE -> criteriaBuilder.and(
                    criteriaBuilder.equal(root.get("status"), VendorAccessContractStatus.ACTIVE),
                    criteriaBuilder.or(
                            criteriaBuilder.isNull(root.get("expiresAt")),
                            criteriaBuilder.greaterThan(root.get("expiresAt"), now)
                    )
            );
            case EXPIRED -> criteriaBuilder.or(
                    criteriaBuilder.equal(root.get("status"), VendorAccessContractStatus.EXPIRED),
                    criteriaBuilder.and(
                            criteriaBuilder.equal(root.get("status"), VendorAccessContractStatus.ACTIVE),
                            criteriaBuilder.isNotNull(root.get("expiresAt")),
                            criteriaBuilder.lessThanOrEqualTo(root.get("expiresAt"), now)
                    )
            );
            case REVOKED -> criteriaBuilder.equal(root.get("status"), VendorAccessContractStatus.REVOKED);
        };
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String normalizeEmailOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String toJson(Map<String, Object> details) {
        try {
            return objectMapper.writeValueAsString(details);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not serialize audit details", ex);
        }
    }
}

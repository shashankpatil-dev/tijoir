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
import com.tijoir.connection.dto.CreateVendorContractGrantRequest;
import com.tijoir.connection.dto.CreateVendorRequest;
import com.tijoir.connection.dto.IncomingVendorContractResponse;
import com.tijoir.connection.dto.OffboardVendorResponse;
import com.tijoir.connection.dto.VendorContractResponse;
import com.tijoir.connection.dto.VendorContractGrantResponse;
import com.tijoir.connection.dto.VendorResponse;
import com.tijoir.contract.ContractPermission;
import com.tijoir.organization.Organization;
import com.tijoir.organization.OrganizationAuthorizationService;
import com.tijoir.organization.OrganizationRepository;
import com.tijoir.organization.UserAccount;
import com.tijoir.dashboard.DashboardSummaryService;
import com.tijoir.notification.NotificationService;
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
    private final VendorContractSecretGrantRepository vendorContractSecretGrantRepository;
    private final VaultSecretRepository vaultSecretRepository;
    private final ShareLinkRepository shareLinkRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationAuthorizationService authorizationService;
    private final AuditEventRepository auditEventRepository;
    private final DashboardSummaryService dashboardSummaryService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public VendorService(
            VendorRepository vendorRepository,
            VendorAccessContractRepository vendorAccessContractRepository,
            VendorContractSecretGrantRepository vendorContractSecretGrantRepository,
            VaultSecretRepository vaultSecretRepository,
            ShareLinkRepository shareLinkRepository,
            OrganizationRepository organizationRepository,
            OrganizationAuthorizationService authorizationService,
            AuditEventRepository auditEventRepository,
            DashboardSummaryService dashboardSummaryService,
            NotificationService notificationService,
            ObjectMapper objectMapper
    ) {
        this.vendorRepository = vendorRepository;
        this.vendorAccessContractRepository = vendorAccessContractRepository;
        this.vendorContractSecretGrantRepository = vendorContractSecretGrantRepository;
        this.vaultSecretRepository = vaultSecretRepository;
        this.shareLinkRepository = shareLinkRepository;
        this.organizationRepository = organizationRepository;
        this.authorizationService = authorizationService;
        this.auditEventRepository = auditEventRepository;
        this.dashboardSummaryService = dashboardSummaryService;
        this.notificationService = notificationService;
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
        Organization linkedOrganization = resolveLinkedOrganization(actor.getOrganization(), request.linkedOrganizationSlug());

        Vendor vendor = vendorRepository.save(new Vendor(
                actor.getOrganization(),
                actor,
                linkedOrganization,
                request.name().trim(),
                normalizeOptional(request.contactName()),
                normalizeEmailOptional(request.contactEmail()),
                normalizeOptional(request.notes())
        ));

        Map<String, Object> auditDetails = new LinkedHashMap<>();
        auditDetails.put("name", vendor.getName());
        auditDetails.put("contactEmail", vendor.getContactEmail());
        auditDetails.put("linkedOrganizationSlug", linkedOrganization != null ? linkedOrganization.getSlug() : null);

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

    @Transactional(readOnly = true)
    public PageResponse<IncomingVendorContractResponse> listIncomingContracts(
            AuthenticatedUser principal,
            Integer page,
            Integer size,
            VendorAccessContractStatus status
    ) {
        authorizationService.requireVendorManager(principal.role());
        Instant now = Instant.now();
        PageRequest pageRequest = PageRequestFactory.create(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<IncomingVendorContractResponse> results = vendorAccessContractRepository
                .findAll(incomingContractSpec(principal.organizationId(), status, now), pageRequest)
                .map(contract -> toIncomingContractResponse(contract, effectiveContractStatus(contract, now)));
        return PageResponse.from(results);
    }

    @Transactional(readOnly = true)
    public PageResponse<VendorContractGrantResponse> listGrants(
            AuthenticatedUser principal,
            UUID contractId,
            Integer page,
            Integer size,
            VendorContractGrantStatus status
    ) {
        authorizationService.requireVendorManager(principal.role());
        VendorAccessContract contract = findAccessibleContract(principal.organizationId(), contractId);
        Instant now = Instant.now();
        PageRequest pageRequest = PageRequestFactory.create(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<VendorContractGrantResponse> results = vendorContractSecretGrantRepository
                .findAll(grantSpec(contract.getOrganization().getId(), contract.getId(), status, now), pageRequest)
                .map(grant -> toGrantResponse(grant, effectiveGrantStatus(grant, now)));
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

        validateExpiry(request.expiresAt());
        VendorAccessContractStatus initialStatus = vendor.getLinkedOrganization() != null
                ? VendorAccessContractStatus.PROPOSED
                : VendorAccessContractStatus.ACTIVE;

        VendorAccessContract contract = vendorAccessContractRepository.save(new VendorAccessContract(
                actor.getOrganization(),
                vendor,
                actor,
                request.permission(),
                initialStatus,
                request.expiresAt()
        ));

        Map<String, Object> auditDetails = new LinkedHashMap<>();
        auditDetails.put("vendorId", vendor.getId());
        auditDetails.put("permission", request.permission().name());
        auditDetails.put("status", initialStatus.name());
        auditDetails.put("linkedOrganizationSlug", vendor.getLinkedOrganization() != null ? vendor.getLinkedOrganization().getSlug() : null);
        auditEventRepository.save(new AuditEvent(
                actor.getOrganization(),
                actor,
                AuditAction.VENDOR_CONTRACT_CREATED,
                "VENDOR_ACCESS_CONTRACT",
                contract.getId(),
                toJson(auditDetails)
        ));

        if (vendor.getLinkedOrganization() != null && initialStatus == VendorAccessContractStatus.PROPOSED) {
            for (UserAccount manager : notificationService.listVendorManagersForOrganization(vendor.getLinkedOrganization().getId())) {
                notificationService.recordIncomingVendorContractProposed(
                        manager,
                        actor.getOrganization().getName(),
                        vendor.getName()
                );
            }
        }

        dashboardSummaryService.evict(principal.organizationId());
        return toContractResponse(contract, contract.getStatus());
    }

    @Transactional
    public IncomingVendorContractResponse acceptIncomingContract(AuthenticatedUser principal, UUID contractId) {
        UserAccount actor = authorizationService.requireActor(principal);
        authorizationService.requireVendorManager(actor.getRole());

        VendorAccessContract contract = vendorAccessContractRepository.findById(contractId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor contract not found"));
        Vendor vendor = contract.getVendor();
        Organization linkedOrganization = vendor.getLinkedOrganization();
        if (linkedOrganization == null || !linkedOrganization.getId().equals(principal.organizationId())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Incoming vendor contract not found");
        }

        ensureVendorActive(vendor);
        expireContractIfNeeded(contract, Instant.now());
        if (contract.getStatus() == VendorAccessContractStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vendor contract has already been accepted");
        }
        if (contract.getStatus() != VendorAccessContractStatus.PROPOSED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only proposed vendor contracts can be accepted");
        }

        contract.acceptByCounterparty(actor);

        Map<String, Object> auditDetails = new LinkedHashMap<>();
        auditDetails.put("vendorId", vendor.getId());
        auditDetails.put("vendorName", vendor.getName());
        auditDetails.put("ownerOrganizationId", contract.getOrganization().getId());
        auditDetails.put("ownerOrganizationSlug", contract.getOrganization().getSlug());
        auditDetails.put("counterpartyOrganizationId", actor.getOrganization().getId());
        auditDetails.put("counterpartyOrganizationSlug", actor.getOrganization().getSlug());
        auditDetails.put("permission", contract.getContractPermission().name());

        auditEventRepository.save(new AuditEvent(
                contract.getOrganization(),
                actor,
                AuditAction.VENDOR_CONTRACT_ACCEPTED,
                "VENDOR_ACCESS_CONTRACT",
                contract.getId(),
                toJson(auditDetails)
        ));
        auditEventRepository.save(new AuditEvent(
                actor.getOrganization(),
                actor,
                AuditAction.VENDOR_CONTRACT_ACCEPTED,
                "VENDOR_ACCESS_CONTRACT",
                contract.getId(),
                toJson(auditDetails)
        ));

        for (UserAccount manager : notificationService.listVendorManagersForOrganization(contract.getOrganization().getId())) {
            notificationService.recordVendorContractAccepted(
                    manager,
                    actor.getOrganization().getName(),
                    vendor.getName()
            );
        }

        dashboardSummaryService.evict(contract.getOrganization().getId());
        dashboardSummaryService.evict(actor.getOrganization().getId());
        return toIncomingContractResponse(contract, contract.getStatus());
    }

    @Transactional
    public IncomingVendorContractResponse rejectIncomingContract(AuthenticatedUser principal, UUID contractId) {
        UserAccount actor = authorizationService.requireActor(principal);
        authorizationService.requireVendorManager(actor.getRole());

        VendorAccessContract contract = vendorAccessContractRepository.findById(contractId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor contract not found"));
        Vendor vendor = contract.getVendor();
        Organization linkedOrganization = vendor.getLinkedOrganization();
        if (linkedOrganization == null || !linkedOrganization.getId().equals(principal.organizationId())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Incoming vendor contract not found");
        }

        ensureVendorActive(vendor);
        expireContractIfNeeded(contract, Instant.now());
        if (contract.getStatus() == VendorAccessContractStatus.REJECTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vendor contract has already been rejected");
        }
        if (contract.getStatus() == VendorAccessContractStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vendor contract has already been accepted");
        }
        if (contract.getStatus() != VendorAccessContractStatus.PROPOSED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only proposed vendor contracts can be rejected");
        }

        contract.rejectByCounterparty();

        Map<String, Object> auditDetails = new LinkedHashMap<>();
        auditDetails.put("vendorId", vendor.getId());
        auditDetails.put("vendorName", vendor.getName());
        auditDetails.put("ownerOrganizationId", contract.getOrganization().getId());
        auditDetails.put("ownerOrganizationSlug", contract.getOrganization().getSlug());
        auditDetails.put("counterpartyOrganizationId", actor.getOrganization().getId());
        auditDetails.put("counterpartyOrganizationSlug", actor.getOrganization().getSlug());
        auditDetails.put("permission", contract.getContractPermission().name());

        auditEventRepository.save(new AuditEvent(
                contract.getOrganization(),
                actor,
                AuditAction.VENDOR_CONTRACT_REJECTED,
                "VENDOR_ACCESS_CONTRACT",
                contract.getId(),
                toJson(auditDetails)
        ));
        auditEventRepository.save(new AuditEvent(
                actor.getOrganization(),
                actor,
                AuditAction.VENDOR_CONTRACT_REJECTED,
                "VENDOR_ACCESS_CONTRACT",
                contract.getId(),
                toJson(auditDetails)
        ));

        for (UserAccount manager : notificationService.listVendorManagersForOrganization(contract.getOrganization().getId())) {
            notificationService.recordVendorContractRejected(
                    manager,
                    actor.getOrganization().getName(),
                    vendor.getName()
            );
        }

        dashboardSummaryService.evict(contract.getOrganization().getId());
        dashboardSummaryService.evict(actor.getOrganization().getId());
        return toIncomingContractResponse(contract, contract.getStatus());
    }

    @Transactional
    public VendorContractGrantResponse createGrant(
            AuthenticatedUser principal,
            UUID contractId,
            CreateVendorContractGrantRequest request
    ) {
        UserAccount actor = authorizationService.requireActor(principal);
        authorizationService.requireVendorManager(actor.getRole());

        VendorAccessContract contract = findContract(principal.organizationId(), contractId);
        ensureVendorActive(contract.getVendor());
        expireContractIfNeeded(contract, Instant.now());
        if (contract.getStatus() != VendorAccessContractStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Secret grants can only be created for active contracts");
        }

        VaultSecret secret = vaultSecretRepository.findByIdAndOrganizationId(request.secretId(), principal.organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Secret not found"));
        if (secret.getStatus() != SecretStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Secret grants can only target active secrets");
        }
        validateExpiry(request.expiresAt());
        if (contract.getContractPermission() != request.permission()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Grant permission must match the parent contract permission");
        }
        if (vendorContractSecretGrantRepository.existsByContractIdAndSecretIdAndStatus(contractId, secret.getId(), VendorContractGrantStatus.ACTIVE)) {
            throw new ApiException(HttpStatus.CONFLICT, "An active secret grant already exists for this contract and secret");
        }
        if (hasActiveGrantForVendorSecret(contract.getVendor().getId(), secret.getId(), Instant.now())) {
            throw new ApiException(HttpStatus.CONFLICT, "An active vendor secret grant already exposes this secret for the vendor");
        }

        VendorContractSecretGrant grant = vendorContractSecretGrantRepository.save(new VendorContractSecretGrant(
                actor.getOrganization(),
                contract,
                secret,
                actor,
                request.permission(),
                request.expiresAt() != null ? request.expiresAt() : contract.getExpiresAt()
        ));

        auditEventRepository.save(new AuditEvent(
                actor.getOrganization(),
                actor,
                AuditAction.VENDOR_CONTRACT_GRANT_CREATED,
                "VENDOR_CONTRACT_SECRET_GRANT",
                grant.getId(),
                toJson(Map.of(
                        "contractId", contract.getId(),
                        "vendorId", contract.getVendor().getId(),
                        "secretId", secret.getId(),
                        "secretKey", secret.getSecretKey(),
                        "permission", grant.getPermission().name()
                ))
        ));

        dashboardSummaryService.evict(principal.organizationId());
        return toGrantResponse(grant, grant.getStatus());
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
        if (contract.getStatus() == VendorAccessContractStatus.ACTIVE || contract.getStatus() == VendorAccessContractStatus.PROPOSED) {
            contract.revoke();
            int revokedGrants = 0;
            for (VendorContractSecretGrant grant : vendorContractSecretGrantRepository.findAllByContractIdAndStatus(contract.getId(), VendorContractGrantStatus.ACTIVE)) {
                grant.revoke();
                revokedGrants++;
            }
            auditEventRepository.save(new AuditEvent(
                    actor.getOrganization(),
                    actor,
                    AuditAction.VENDOR_CONTRACT_REVOKED,
                    "VENDOR_ACCESS_CONTRACT",
                    contract.getId(),
                    toJson(Map.of(
                            "vendorId", vendor.getId(),
                            "permission", contract.getContractPermission().name(),
                            "revokedGrants", revokedGrants
                    ))
            ));
        }

        return toContractResponse(contract, effectiveContractStatus(contract, Instant.now()));
    }

    @Transactional
    public VendorContractGrantResponse revokeGrant(
            AuthenticatedUser principal,
            UUID contractId,
            UUID grantId
    ) {
        UserAccount actor = authorizationService.requireActor(principal);
        authorizationService.requireVendorManager(actor.getRole());

        VendorAccessContract contract = findContract(principal.organizationId(), contractId);
        VendorContractSecretGrant grant = vendorContractSecretGrantRepository.findByIdAndOrganizationId(grantId, principal.organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor contract grant not found"));
        if (!grant.getContract().getId().equals(contract.getId())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Vendor contract grant not found");
        }

        expireGrantIfNeeded(grant, Instant.now());
        if (grant.getStatus() == VendorContractGrantStatus.ACTIVE) {
            grant.revoke();
            auditEventRepository.save(new AuditEvent(
                    actor.getOrganization(),
                    actor,
                    AuditAction.VENDOR_CONTRACT_GRANT_REVOKED,
                    "VENDOR_CONTRACT_SECRET_GRANT",
                    grant.getId(),
                    toJson(Map.of(
                            "contractId", contract.getId(),
                            "vendorId", contract.getVendor().getId(),
                            "secretId", grant.getSecret().getId(),
                            "secretKey", grant.getSecret().getSecretKey(),
                            "permission", grant.getPermission().name()
                    ))
            ));
            dashboardSummaryService.evict(principal.organizationId());
        }

        return toGrantResponse(grant, effectiveGrantStatus(grant, Instant.now()));
    }

    @Transactional
    public OffboardVendorResponse offboard(AuthenticatedUser principal, UUID vendorId) {
        UserAccount actor = authorizationService.requireActor(principal);
        authorizationService.requireVendorManager(actor.getRole());

        Vendor vendor = findVendor(principal.organizationId(), vendorId);
        Instant now = Instant.now();

        int revokedContracts = 0;
        int revokedGrants = 0;
        for (VendorAccessContract contract : vendorAccessContractRepository.findAllByVendorIdAndStatusIn(
                vendorId,
                List.of(VendorAccessContractStatus.PROPOSED, VendorAccessContractStatus.ACTIVE))) {
            expireContractIfNeeded(contract, now);
            if (contract.getStatus() == VendorAccessContractStatus.PROPOSED
                    || contract.getStatus() == VendorAccessContractStatus.ACTIVE) {
                contract.revoke();
                revokedContracts++;
            }
            for (VendorContractSecretGrant grant : vendorContractSecretGrantRepository.findAllByContractIdAndStatus(contract.getId(), VendorContractGrantStatus.ACTIVE)) {
                grant.revoke();
                revokedGrants++;
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
                        "revokedGrants", revokedGrants,
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

    private VendorAccessContract findContract(UUID organizationId, UUID contractId) {
        return vendorAccessContractRepository.findByIdAndOrganizationId(contractId, organizationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor contract not found"));
    }

    private VendorAccessContract findAccessibleContract(UUID organizationId, UUID contractId) {
        VendorAccessContract contract = vendorAccessContractRepository.findById(contractId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vendor contract not found"));
        if (contract.getOrganization().getId().equals(organizationId)) {
            return contract;
        }
        Organization linkedOrganization = contract.getVendor().getLinkedOrganization();
        if (linkedOrganization != null && linkedOrganization.getId().equals(organizationId)) {
            return contract;
        }
        throw new ApiException(HttpStatus.NOT_FOUND, "Vendor contract not found");
    }

    private Organization resolveLinkedOrganization(Organization ownerOrganization, String linkedOrganizationSlug) {
        if (linkedOrganizationSlug == null || linkedOrganizationSlug.isBlank()) {
            return null;
        }
        Organization linkedOrganization = organizationRepository.findBySlug(linkedOrganizationSlug.trim())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Linked organization not found"));
        if (linkedOrganization.getId().equals(ownerOrganization.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vendor cannot link to the same organization");
        }
        return linkedOrganization;
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

    private boolean hasActiveGrantForVendorSecret(UUID vendorId, UUID secretId, Instant now) {
        for (VendorAccessContract contract : vendorAccessContractRepository.findAllByVendorIdAndStatus(vendorId, VendorAccessContractStatus.ACTIVE)) {
            expireContractIfNeeded(contract, now);
            if (contract.getStatus() != VendorAccessContractStatus.ACTIVE) {
                continue;
            }
            for (VendorContractSecretGrant grant : vendorContractSecretGrantRepository.findAllByContractIdAndStatus(contract.getId(), VendorContractGrantStatus.ACTIVE)) {
                expireGrantIfNeeded(grant, now);
                if (grant.getStatus() == VendorContractGrantStatus.ACTIVE
                        && grant.getSecret().getId().equals(secretId)) {
                    return true;
                }
            }
        }
        return false;
    }

    private void expireGrantIfNeeded(VendorContractSecretGrant grant, Instant now) {
        if (grant.getStatus() == VendorContractGrantStatus.ACTIVE && grant.isExpiredAt(now)) {
            grant.expire();
        }
    }

    private void expireContractIfNeeded(VendorAccessContract contract, Instant now) {
        if ((contract.getStatus() == VendorAccessContractStatus.ACTIVE
                || contract.getStatus() == VendorAccessContractStatus.PROPOSED)
                && contract.isExpiredAt(now)) {
            contract.expire();
        }
    }

    private VendorAccessContractStatus effectiveContractStatus(VendorAccessContract contract, Instant now) {
        if ((contract.getStatus() == VendorAccessContractStatus.ACTIVE
                || contract.getStatus() == VendorAccessContractStatus.PROPOSED)
                && contract.isExpiredAt(now)) {
            return VendorAccessContractStatus.EXPIRED;
        }
        return contract.getStatus();
    }

    private VendorContractGrantStatus effectiveGrantStatus(VendorContractSecretGrant grant, Instant now) {
        if (grant.getStatus() == VendorContractGrantStatus.ACTIVE && grant.isExpiredAt(now)) {
            return VendorContractGrantStatus.EXPIRED;
        }
        return grant.getStatus();
    }

    private VendorResponse toVendorResponse(Vendor vendor) {
        return new VendorResponse(
                vendor.getId(),
                vendor.getName(),
                vendor.getContactName(),
                vendor.getContactEmail(),
                vendor.getNotes(),
                vendor.getLinkedOrganization() != null ? vendor.getLinkedOrganization().getId() : null,
                vendor.getLinkedOrganization() != null ? vendor.getLinkedOrganization().getName() : null,
                vendor.getLinkedOrganization() != null ? vendor.getLinkedOrganization().getSlug() : null,
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
                contract.getContractPermission(),
                vendorContractSecretGrantRepository.findAllByContractIdAndStatus(contract.getId(), VendorContractGrantStatus.ACTIVE).size(),
                status,
                contract.getExpiresAt(),
                contract.getRevokedAt(),
                contract.getCreatedAt()
        );
    }

    private VendorContractGrantResponse toGrantResponse(
            VendorContractSecretGrant grant,
            VendorContractGrantStatus status
    ) {
        return new VendorContractGrantResponse(
                grant.getId(),
                grant.getContract().getId(),
                grant.getContract().getVendor().getId(),
                grant.getContract().getVendor().getName(),
                grant.getSecret().getId(),
                grant.getSecret().getName(),
                grant.getSecret().getSecretKey(),
                grant.getSecret().getSecretType(),
                grant.getPermission(),
                status,
                grant.getExpiresAt(),
                grant.getRevokedAt(),
                grant.getCreatedAt()
        );
    }

    private IncomingVendorContractResponse toIncomingContractResponse(
            VendorAccessContract contract,
            VendorAccessContractStatus status
    ) {
        return new IncomingVendorContractResponse(
                contract.getId(),
                contract.getOrganization().getId(),
                contract.getOrganization().getName(),
                contract.getOrganization().getSlug(),
                contract.getVendor().getId(),
                contract.getVendor().getName(),
                contract.getContractPermission(),
                vendorContractSecretGrantRepository.findAllByContractIdAndStatus(contract.getId(), VendorContractGrantStatus.ACTIVE).size(),
                status,
                contract.getExpiresAt(),
                contract.getCounterpartyAcceptedAt(),
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

    private Specification<VendorAccessContract> incomingContractSpec(
            UUID counterpartyOrganizationId,
            VendorAccessContractStatus status,
            Instant now
    ) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            Predicate predicate = criteriaBuilder.equal(
                    root.get("vendor").get("linkedOrganization").get("id"),
                    counterpartyOrganizationId
            );
            if (status != null) {
                predicate = criteriaBuilder.and(predicate, contractStatusPredicate(root, criteriaBuilder, status, now));
            }
            return predicate;
        };
    }

    private Specification<VendorContractSecretGrant> grantSpec(
            UUID organizationId,
            UUID contractId,
            VendorContractGrantStatus status,
            Instant now
    ) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            Predicate predicate = criteriaBuilder.equal(root.get("organization").get("id"), organizationId);
            predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("contract").get("id"), contractId));
            if (status != null) {
                predicate = criteriaBuilder.and(predicate, grantStatusPredicate(root, criteriaBuilder, status, now));
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
            case PROPOSED -> criteriaBuilder.and(
                    criteriaBuilder.equal(root.get("status"), VendorAccessContractStatus.PROPOSED),
                    criteriaBuilder.or(
                            criteriaBuilder.isNull(root.get("expiresAt")),
                            criteriaBuilder.greaterThan(root.get("expiresAt"), now)
                    )
            );
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
                            root.get("status").in(VendorAccessContractStatus.ACTIVE, VendorAccessContractStatus.PROPOSED),
                            criteriaBuilder.isNotNull(root.get("expiresAt")),
                            criteriaBuilder.lessThanOrEqualTo(root.get("expiresAt"), now)
                    )
            );
            case REJECTED -> criteriaBuilder.equal(root.get("status"), VendorAccessContractStatus.REJECTED);
            case REVOKED -> criteriaBuilder.equal(root.get("status"), VendorAccessContractStatus.REVOKED);
        };
    }

    private Predicate grantStatusPredicate(
            jakarta.persistence.criteria.Root<VendorContractSecretGrant> root,
            jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
            VendorContractGrantStatus status,
            Instant now
    ) {
        return switch (status) {
            case ACTIVE -> criteriaBuilder.and(
                    criteriaBuilder.equal(root.get("status"), VendorContractGrantStatus.ACTIVE),
                    criteriaBuilder.or(
                            criteriaBuilder.isNull(root.get("expiresAt")),
                            criteriaBuilder.greaterThan(root.get("expiresAt"), now)
                    )
            );
            case EXPIRED -> criteriaBuilder.or(
                    criteriaBuilder.equal(root.get("status"), VendorContractGrantStatus.EXPIRED),
                    criteriaBuilder.and(
                            criteriaBuilder.equal(root.get("status"), VendorContractGrantStatus.ACTIVE),
                            criteriaBuilder.isNotNull(root.get("expiresAt")),
                            criteriaBuilder.lessThanOrEqualTo(root.get("expiresAt"), now)
                    )
            );
            case REVOKED -> criteriaBuilder.equal(root.get("status"), VendorContractGrantStatus.REVOKED);
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

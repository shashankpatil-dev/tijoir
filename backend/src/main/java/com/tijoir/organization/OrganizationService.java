package com.tijoir.organization;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tijoir.audit.AuditAction;
import com.tijoir.audit.AuditEvent;
import com.tijoir.audit.AuditEventRepository;
import com.tijoir.auth.AuthService;
import com.tijoir.auth.dto.OrganizationSummary;
import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.common.exception.ApiException;
import com.tijoir.common.paging.PageRequestFactory;
import com.tijoir.common.paging.PageResponse;
import com.tijoir.common.util.CryptoUtil;
import com.tijoir.dashboard.DashboardSummaryService;
import com.tijoir.identity.IdentityMembershipSyncService;
import com.tijoir.identity.IdentityUser;
import com.tijoir.identity.IdentityUserRepository;
import com.tijoir.identity.OrganizationMembershipRepository;
import com.tijoir.notification.NotificationEmailDeliveryStatus;
import com.tijoir.notification.NotificationProperties;
import com.tijoir.notification.NotificationService;
import com.tijoir.organization.dto.AcceptInviteRequest;
import com.tijoir.organization.dto.CreateInviteRequest;
import com.tijoir.organization.dto.InviteResponse;
import com.tijoir.organization.dto.InviteResolutionResponse;
import com.tijoir.organization.dto.MemberResponse;
import com.tijoir.organization.dto.OrganizationPolicyResponse;
import com.tijoir.organization.dto.UpdateMemberRoleRequest;
import com.tijoir.organization.dto.UpdateOrganizationPolicyRequest;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class OrganizationService {
    private final UserAccountRepository userAccountRepository;
    private final OrganizationInviteRepository organizationInviteRepository;
    private final OrganizationPolicyRepository organizationPolicyRepository;
    private final IdentityUserRepository identityUserRepository;
    private final OrganizationMembershipRepository organizationMembershipRepository;
    private final OrganizationAuthorizationService authorizationService;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final AuditEventRepository auditEventRepository;
    private final DashboardSummaryService dashboardSummaryService;
    private final IdentityMembershipSyncService identityMembershipSyncService;
    private final NotificationService notificationService;
    private final NotificationProperties notificationProperties;
    private final ObjectMapper objectMapper;
    private final long inviteExpirationHours;

    public OrganizationService(
            UserAccountRepository userAccountRepository,
            OrganizationInviteRepository organizationInviteRepository,
            OrganizationPolicyRepository organizationPolicyRepository,
            IdentityUserRepository identityUserRepository,
            OrganizationMembershipRepository organizationMembershipRepository,
            OrganizationAuthorizationService authorizationService,
            PasswordEncoder passwordEncoder,
            AuthService authService,
            AuditEventRepository auditEventRepository,
            DashboardSummaryService dashboardSummaryService,
            IdentityMembershipSyncService identityMembershipSyncService,
            NotificationService notificationService,
            NotificationProperties notificationProperties,
            ObjectMapper objectMapper,
            @Value("${tijoir.security.organization-invite-expiration-hours}") long inviteExpirationHours
    ) {
        this.userAccountRepository = userAccountRepository;
        this.organizationInviteRepository = organizationInviteRepository;
        this.organizationPolicyRepository = organizationPolicyRepository;
        this.identityUserRepository = identityUserRepository;
        this.organizationMembershipRepository = organizationMembershipRepository;
        this.authorizationService = authorizationService;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
        this.auditEventRepository = auditEventRepository;
        this.dashboardSummaryService = dashboardSummaryService;
        this.identityMembershipSyncService = identityMembershipSyncService;
        this.notificationService = notificationService;
        this.notificationProperties = notificationProperties;
        this.objectMapper = objectMapper;
        this.inviteExpirationHours = inviteExpirationHours;
    }

    @Transactional
    public OrganizationSummary updateOrganizationName(AuthenticatedUser principal, String name) {
        UserAccount actor = authorizationService.requireActor(principal);
        authorizationService.requireOrganizationManager(principal.role());
        Organization organization = actor.getOrganization();
        organization.rename(name.trim());
        return new OrganizationSummary(
                organization.getId(),
                organization.getName(),
                organization.getSlug(),
                organization.getEmail()
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<MemberResponse> listMembers(
            AuthenticatedUser principal,
            Integer page,
            Integer size,
            String query,
            UserRole role
    ) {
        authorizationService.requireOrganizationManager(principal.role());
        PageRequest pageRequest = PageRequestFactory.create(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        Page<MemberResponse> results = userAccountRepository.findAll(memberSpec(principal.organizationId(), query, role), pageRequest)
                .map(this::toMemberResponse);
        return PageResponse.from(results);
    }

    @Transactional(readOnly = true)
    public PageResponse<InviteResponse> listInvites(
            AuthenticatedUser principal,
            Integer page,
            Integer size,
            String query,
            UserRole role,
            OrganizationInviteStatus status
    ) {
        authorizationService.requireOrganizationManager(principal.role());
        Instant now = Instant.now();
        PageRequest pageRequest = PageRequestFactory.create(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<InviteResponse> results = organizationInviteRepository.findAll(inviteSpec(principal.organizationId(), query, role, status, now), pageRequest)
                .map(invite -> toInviteResponse(invite, null, now));
        return PageResponse.from(results);
    }

    @Transactional
    public InviteResponse createInvite(AuthenticatedUser principal, CreateInviteRequest request) {
        UserAccount actor = authorizationService.requireActor(principal);
        authorizationService.requireInviteRole(actor.getRole(), request.role());

        String normalizedEmail = normalizeEmail(request.email());
        if (userAccountRepository.existsByOrganizationIdAndEmailIgnoreCaseAndDeactivatedAtIsNull(actor.getOrganization().getId(), normalizedEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "That email is already a member of this organization");
        }

        Instant expiresAt = request.expiresAt() != null
                ? request.expiresAt()
                : Instant.now().plusSeconds(inviteExpirationHours * 60 * 60);
        if (!expiresAt.isAfter(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invite expiry must be in the future");
        }

        String rawToken = CryptoUtil.randomUrlToken(32);
        OrganizationInvite invite = organizationInviteRepository.save(new OrganizationInvite(
                actor.getOrganization(),
                actor,
                normalizedEmail,
                request.role(),
                CryptoUtil.sha256Hex(rawToken),
                expiresAt
        ));

        auditEventRepository.save(new AuditEvent(
                actor.getOrganization(),
                actor,
                AuditAction.MEMBER_INVITED,
                "ORGANIZATION_INVITE",
                invite.getId(),
                toJson(Map.of(
                        "email", normalizedEmail,
                        "role", request.role().name()
                ))
        ));

        dashboardSummaryService.evict(principal.organizationId());
        notificationService.recordInviteCreated(actor, invite, rawToken);
        return toInviteResponse(
                invite,
                notificationProperties.isExposeDevTokens() ? rawToken : null,
                Instant.now()
        );
    }

    @Transactional
    public InviteResponse revokeInvite(AuthenticatedUser principal, UUID inviteId) {
        UserAccount actor = authorizationService.requireActor(principal);
        authorizationService.requireOrganizationManager(actor.getRole());

        OrganizationInvite invite = organizationInviteRepository.findByIdAndOrganizationId(inviteId, principal.organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invite not found"));
        if (invite.statusAt(Instant.now()) == OrganizationInviteStatus.ACCEPTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Accepted invites cannot be revoked");
        }
        invite.revoke();

        auditEventRepository.save(new AuditEvent(
                actor.getOrganization(),
                actor,
                AuditAction.MEMBER_INVITE_REVOKED,
                "ORGANIZATION_INVITE",
                invite.getId(),
                toJson(Map.of(
                        "email", invite.getEmail(),
                        "role", invite.getRole().name()
                ))
        ));

        dashboardSummaryService.evict(principal.organizationId());
        return toInviteResponse(invite, null, Instant.now());
    }

    @Transactional
    public InviteResponse resendInvite(AuthenticatedUser principal, UUID inviteId) {
        UserAccount actor = authorizationService.requireActor(principal);
        authorizationService.requireOrganizationManager(actor.getRole());

        OrganizationInvite invite = organizationInviteRepository.findByIdAndOrganizationId(inviteId, principal.organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invite not found"));

        OrganizationInviteStatus currentStatus = invite.statusAt(Instant.now());
        if (currentStatus == OrganizationInviteStatus.ACCEPTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Accepted invites cannot be resent");
        }
        if (currentStatus == OrganizationInviteStatus.REVOKED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Revoked invites cannot be resent");
        }
        if (userAccountRepository.existsByOrganizationIdAndEmailIgnoreCaseAndDeactivatedAtIsNull(actor.getOrganization().getId(), invite.getEmail())) {
            throw new ApiException(HttpStatus.CONFLICT, "That email is already a member of this organization");
        }

        String rawToken = CryptoUtil.randomUrlToken(32);
        Instant expiresAt = Instant.now().plusSeconds(inviteExpirationHours * 60 * 60);
        invite.reissue(CryptoUtil.sha256Hex(rawToken), expiresAt);

        auditEventRepository.save(new AuditEvent(
                actor.getOrganization(),
                actor,
                AuditAction.MEMBER_INVITED,
                "ORGANIZATION_INVITE",
                invite.getId(),
                toJson(Map.of(
                        "email", invite.getEmail(),
                        "role", invite.getRole().name(),
                        "resent", true
                ))
        ));

        dashboardSummaryService.evict(principal.organizationId());
        notificationService.recordInviteResent(actor, invite, rawToken);
        return toInviteResponse(
                invite,
                notificationProperties.isExposeDevTokens() ? rawToken : null,
                Instant.now()
        );
    }

    @Transactional
    public InviteResolutionResponse resolveInvite(String token) {
        OrganizationInvite invite = findInviteByToken(token);
        Instant now = Instant.now();
        return new InviteResolutionResponse(
                invite.getOrganization().getId(),
                invite.getOrganization().getName(),
                invite.getOrganization().getSlug(),
                invite.getEmail(),
                invite.getRole(),
                invite.statusAt(now),
                invite.getExpiresAt(),
                identityUserRepository.findByEmailIgnoreCase(invite.getEmail()).isPresent()
        );
    }

    @Transactional
    public AuthService.IssuedSession acceptInvite(AuthenticatedUser principal, AcceptInviteRequest request) {
        OrganizationInvite invite = findInviteByToken(request.token());
        ensurePendingInvite(invite);

        IdentityUser existingIdentity = identityUserRepository.findByEmailIgnoreCase(invite.getEmail()).orElse(null);
        UserAccount workspaceUser;

        if (principal != null) {
            IdentityUser principalIdentity = identityUserRepository.findById(principal.identityUserId())
                    .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
            if (!normalizeEmail(principalIdentity.getEmail()).equals(normalizeEmail(invite.getEmail()))) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Sign in with the invited email to accept this invite");
            }
            workspaceUser = createWorkspaceUserForExistingIdentity(invite, principalIdentity);
        } else if (existingIdentity != null) {
            throw new ApiException(HttpStatus.CONFLICT, "Account already exists. Sign in with this email to accept the invite.");
        } else {
            if (request.name() == null || request.name().isBlank()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Name is required to accept this invite");
            }
            if (request.password() == null || request.password().isBlank()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Password is required to accept this invite");
            }

            workspaceUser = new UserAccount(
                    invite.getOrganization(),
                    request.name().trim(),
                    invite.getEmail(),
                    passwordEncoder.encode(request.password()),
                    invite.getRole()
            );
            workspaceUser.markEmailVerified();
            userAccountRepository.save(workspaceUser);
            identityMembershipSyncService.mirrorLegacyUser(workspaceUser);
        }

        invite.accept();

        auditEventRepository.save(new AuditEvent(
                invite.getOrganization(),
                workspaceUser,
                AuditAction.MEMBER_INVITE_ACCEPTED,
                "ORGANIZATION_INVITE",
                invite.getId(),
                toJson(Map.of(
                        "email", invite.getEmail(),
                        "role", invite.getRole().name(),
                        "userId", workspaceUser.getId()
                ))
        ));

        dashboardSummaryService.evict(invite.getOrganization().getId());
        return authService.issueSessionForUser(workspaceUser);
    }

    @Transactional
    public MemberResponse updateMemberRole(
            AuthenticatedUser principal,
            UUID memberId,
            UpdateMemberRoleRequest request
    ) {
        UserAccount actor = authorizationService.requireActor(principal);
        UserAccount target = userAccountRepository.findByIdAndOrganizationIdAndDeactivatedAtIsNull(memberId, principal.organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Member not found"));

        authorizationService.requireRoleChange(actor, target, request.role());
        target.changeRole(request.role());
        identityMembershipSyncService.mirrorLegacyUser(target);

        auditEventRepository.save(new AuditEvent(
                actor.getOrganization(),
                actor,
                AuditAction.MEMBER_ROLE_UPDATED,
                "USER",
                target.getId(),
                toJson(Map.of(
                        "email", target.getEmail(),
                        "role", request.role().name()
                ))
        ));

        return toMemberResponse(target);
    }

    @Transactional
    public void removeMember(AuthenticatedUser principal, UUID memberId) {
        UserAccount actor = authorizationService.requireActor(principal);
        UserAccount target = userAccountRepository.findByIdAndOrganizationIdAndDeactivatedAtIsNull(memberId, principal.organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Member not found"));

        authorizationService.requireMemberRemoval(actor, target);
        target.deactivate();
        identityMembershipSyncService.mirrorLegacyUser(target);

        auditEventRepository.save(new AuditEvent(
                actor.getOrganization(),
                actor,
                AuditAction.MEMBER_REMOVED,
                "USER",
                memberId,
                toJson(Map.of(
                        "email", target.getEmail(),
                        "role", target.getRole().name()
                ))
        ));

        dashboardSummaryService.evict(principal.organizationId());
    }

    @Transactional(readOnly = true)
    public OrganizationPolicyResponse getPolicy(AuthenticatedUser principal) {
        authorizationService.requireOrganizationManager(principal.role());
        return toPolicyResponse(organizationPolicyRepository.findByOrganizationId(principal.organizationId()).orElse(null));
    }

    @Transactional
    public OrganizationPolicyResponse updatePolicy(
            AuthenticatedUser principal,
            UpdateOrganizationPolicyRequest request
    ) {
        UserAccount actor = authorizationService.requireActor(principal);
        authorizationService.requireOrganizationManager(actor.getRole());
        validatePolicyRequest(request);

        OrganizationPolicy policy = organizationPolicyRepository.findByOrganizationId(principal.organizationId())
                .orElseGet(() -> new OrganizationPolicy(
                        actor.getOrganization(),
                        null,
                        false,
                        true,
                        true,
                        true,
                        30
                ));

        policy.update(
                request.defaultShareLinkExpiryHours(),
                request.requireVendorContractForShareLinks(),
                request.allowViewOnce(),
                request.allowViewUntilRevoked(),
                request.allowRotationNotifyOnly(),
                request.rotationReminderDays()
        );
        organizationPolicyRepository.save(policy);

        Map<String, Object> auditDetails = new LinkedHashMap<>();
        auditDetails.put("defaultShareLinkExpiryHours", request.defaultShareLinkExpiryHours());
        auditDetails.put("requireVendorContractForShareLinks", request.requireVendorContractForShareLinks());
        auditDetails.put("allowViewOnce", request.allowViewOnce());
        auditDetails.put("allowViewUntilRevoked", request.allowViewUntilRevoked());
        auditDetails.put("allowRotationNotifyOnly", request.allowRotationNotifyOnly());
        auditDetails.put("rotationReminderDays", request.rotationReminderDays());

        auditEventRepository.save(new AuditEvent(
                actor.getOrganization(),
                actor,
                AuditAction.ORGANIZATION_POLICY_UPDATED,
                "ORGANIZATION_POLICY",
                policy.getId(),
                toJson(auditDetails)
        ));

        return toPolicyResponse(policy);
    }

    private MemberResponse toMemberResponse(UserAccount user) {
        return new MemberResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getEmailVerifiedAt() != null,
                user.getCreatedAt()
        );
    }

    private InviteResponse toInviteResponse(OrganizationInvite invite, String rawToken, Instant now) {
        return new InviteResponse(
                invite.getId(),
                invite.getEmail(),
                invite.getRole(),
                invite.statusAt(now),
                invite.getInvitedBy().getName(),
                invite.getExpiresAt(),
                invite.getAcceptedAt(),
                invite.getCreatedAt(),
                notificationService.latestInviteDeliveryStatus(invite.getId()),
                rawToken,
                rawToken != null ? "/invite" : null
        );
    }

    private OrganizationPolicyResponse toPolicyResponse(OrganizationPolicy policy) {
        if (policy == null) {
            return new OrganizationPolicyResponse(
                    null,
                    false,
                    true,
                    true,
                    true,
                    30,
                    null
            );
        }
        return new OrganizationPolicyResponse(
                policy.getDefaultShareLinkExpiryHours(),
                policy.isRequireVendorContractForShareLinks(),
                policy.isAllowViewOnce(),
                policy.isAllowViewUntilRevoked(),
                policy.isAllowRotationNotifyOnly(),
                policy.getRotationReminderDays(),
                policy.getUpdatedAt()
        );
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private OrganizationInvite findInviteByToken(String token) {
        return organizationInviteRepository.findByTokenHash(CryptoUtil.sha256Hex(token))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invite not found"));
    }

    private void ensurePendingInvite(OrganizationInvite invite) {
        Instant now = Instant.now();
        OrganizationInviteStatus status = invite.statusAt(now);
        if (status == OrganizationInviteStatus.REVOKED) {
            throw new ApiException(HttpStatus.GONE, "Invite has been revoked");
        }
        if (status == OrganizationInviteStatus.ACCEPTED) {
            throw new ApiException(HttpStatus.GONE, "Invite has already been accepted");
        }
        if (status == OrganizationInviteStatus.EXPIRED) {
            throw new ApiException(HttpStatus.GONE, "Invite has expired");
        }
    }

    private UserAccount createWorkspaceUserForExistingIdentity(OrganizationInvite invite, IdentityUser identityUser) {
        if (organizationMembershipRepository.findByIdentityUserIdAndOrganizationId(identityUser.getId(), invite.getOrganization().getId()).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "This account already belongs to the invited organization");
        }

        UserAccount workspaceUser = new UserAccount(
                invite.getOrganization(),
                identityUser.getName(),
                identityUser.getEmail(),
                identityUser.getPasswordHash(),
                invite.getRole()
        );
        if (identityUser.getEmailVerifiedAt() != null) {
            workspaceUser.markEmailVerified();
        }
        userAccountRepository.save(workspaceUser);
        identityMembershipSyncService.mirrorLegacyUser(workspaceUser);
        return workspaceUser;
    }

    private void validatePolicyRequest(UpdateOrganizationPolicyRequest request) {
        if (!request.allowViewOnce() && !request.allowViewUntilRevoked() && !request.allowRotationNotifyOnly()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "At least one share permission mode must remain enabled");
        }
    }

    private String toJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not serialize audit payload", ex);
        }
    }

    private Specification<UserAccount> memberSpec(UUID organizationId, String query, UserRole role) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            Predicate predicate = criteriaBuilder.equal(root.get("organization").get("id"), organizationId);
            predicate = criteriaBuilder.and(predicate, criteriaBuilder.isNull(root.get("deactivatedAt")));

            if (query != null && !query.isBlank()) {
                String pattern = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), pattern)
                ));
            }
            if (role != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("role"), role));
            }
            return predicate;
        };
    }

    private Specification<OrganizationInvite> inviteSpec(
            UUID organizationId,
            String query,
            UserRole role,
            OrganizationInviteStatus status,
            Instant now
    ) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            Predicate predicate = criteriaBuilder.equal(root.get("organization").get("id"), organizationId);

            if (query != null && !query.isBlank()) {
                String pattern = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), pattern));
            }
            if (role != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("role"), role));
            }
            if (status != null) {
                predicate = criteriaBuilder.and(predicate, inviteStatusPredicate(root, criteriaBuilder, status, now));
            }
            return predicate;
        };
    }

    private Predicate inviteStatusPredicate(
            jakarta.persistence.criteria.Root<OrganizationInvite> root,
            jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
            OrganizationInviteStatus status,
            Instant now
    ) {
        return switch (status) {
            case REVOKED -> criteriaBuilder.isNotNull(root.get("revokedAt"));
            case ACCEPTED -> criteriaBuilder.isNotNull(root.get("acceptedAt"));
            case EXPIRED -> criteriaBuilder.and(
                    criteriaBuilder.isNull(root.get("revokedAt")),
                    criteriaBuilder.isNull(root.get("acceptedAt")),
                    criteriaBuilder.lessThanOrEqualTo(root.get("expiresAt"), now)
            );
            case PENDING -> criteriaBuilder.and(
                    criteriaBuilder.isNull(root.get("revokedAt")),
                    criteriaBuilder.isNull(root.get("acceptedAt")),
                    criteriaBuilder.greaterThan(root.get("expiresAt"), now)
            );
        };
    }
}

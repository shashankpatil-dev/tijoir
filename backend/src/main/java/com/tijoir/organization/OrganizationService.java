package com.tijoir.organization;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tijoir.audit.AuditAction;
import com.tijoir.audit.AuditEvent;
import com.tijoir.audit.AuditEventRepository;
import com.tijoir.auth.AuthService;
import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.common.exception.ApiException;
import com.tijoir.common.paging.PageRequestFactory;
import com.tijoir.common.paging.PageResponse;
import com.tijoir.common.util.CryptoUtil;
import com.tijoir.organization.dto.AcceptInviteRequest;
import com.tijoir.organization.dto.CreateInviteRequest;
import com.tijoir.organization.dto.InviteResponse;
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
    private final OrganizationAuthorizationService authorizationService;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final AuditEventRepository auditEventRepository;
    private final ObjectMapper objectMapper;
    private final long inviteExpirationHours;

    public OrganizationService(
            UserAccountRepository userAccountRepository,
            OrganizationInviteRepository organizationInviteRepository,
            OrganizationPolicyRepository organizationPolicyRepository,
            OrganizationAuthorizationService authorizationService,
            PasswordEncoder passwordEncoder,
            AuthService authService,
            AuditEventRepository auditEventRepository,
            ObjectMapper objectMapper,
            @Value("${tijoir.security.organization-invite-expiration-hours}") long inviteExpirationHours
    ) {
        this.userAccountRepository = userAccountRepository;
        this.organizationInviteRepository = organizationInviteRepository;
        this.organizationPolicyRepository = organizationPolicyRepository;
        this.authorizationService = authorizationService;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
        this.auditEventRepository = auditEventRepository;
        this.objectMapper = objectMapper;
        this.inviteExpirationHours = inviteExpirationHours;
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
        if (userAccountRepository.existsByEmailIgnoreCaseAndDeactivatedAtIsNull(normalizedEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "User email is already registered");
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

        return toInviteResponse(invite, rawToken, Instant.now());
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

        return toInviteResponse(invite, null, Instant.now());
    }

    @Transactional
    public AuthService.IssuedSession acceptInvite(AcceptInviteRequest request) {
        OrganizationInvite invite = organizationInviteRepository.findByTokenHash(CryptoUtil.sha256Hex(request.token()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invite not found"));

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
        if (userAccountRepository.existsByEmailIgnoreCaseAndDeactivatedAtIsNull(invite.getEmail())) {
            throw new ApiException(HttpStatus.CONFLICT, "User email is already registered");
        }

        UserAccount user = new UserAccount(
                invite.getOrganization(),
                request.name().trim(),
                invite.getEmail(),
                passwordEncoder.encode(request.password()),
                invite.getRole()
        );
        user.markEmailVerified();
        userAccountRepository.save(user);
        invite.accept();

        auditEventRepository.save(new AuditEvent(
                invite.getOrganization(),
                user,
                AuditAction.MEMBER_INVITE_ACCEPTED,
                "ORGANIZATION_INVITE",
                invite.getId(),
                toJson(Map.of(
                        "email", invite.getEmail(),
                        "role", invite.getRole().name(),
                        "userId", user.getId()
                ))
        ));

        return authService.issueSessionForUser(user);
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
    }

    @Transactional(readOnly = true)
    public OrganizationPolicyResponse getPolicy(AuthenticatedUser principal) {
        authorizationService.requireOrganizationManager(principal.role());
        OrganizationPolicy policy = organizationPolicyRepository.findByOrganizationId(principal.organizationId())
                .orElse(null);
        return toPolicyResponse(policy);
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

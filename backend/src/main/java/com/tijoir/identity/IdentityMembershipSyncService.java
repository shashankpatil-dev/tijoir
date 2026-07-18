package com.tijoir.identity;

import com.tijoir.organization.Organization;
import com.tijoir.organization.UserAccount;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class IdentityMembershipSyncService {
    private final IdentityUserRepository identityUserRepository;
    private final OrganizationMembershipRepository organizationMembershipRepository;

    public IdentityMembershipSyncService(
            IdentityUserRepository identityUserRepository,
            OrganizationMembershipRepository organizationMembershipRepository
    ) {
        this.identityUserRepository = identityUserRepository;
        this.organizationMembershipRepository = organizationMembershipRepository;
    }

    @Transactional
    public void mirrorLegacyUser(UserAccount legacyUser) {
        IdentityUser identityUser = identityUserRepository.findByLegacyUserId(legacyUser.getId())
                .or(() -> identityUserRepository.findByEmailIgnoreCase(legacyUser.getEmail()))
                .orElseGet(() -> new IdentityUser(
                        legacyUser.getId(),
                        legacyUser.getEmail(),
                        legacyUser.getName(),
                        legacyUser.getPasswordHash(),
                        legacyUser.getGoogleSub(),
                        legacyUser.getEmailVerifiedAt(),
                        legacyUser.getDeactivatedAt(),
                        legacyUser.getCreatedAt(),
                        legacyUser.getCreatedAt()
                ));

        identityUser.syncFromLegacy(
                legacyUser.getId(),
                legacyUser.getName(),
                legacyUser.getPasswordHash(),
                legacyUser.getGoogleSub(),
                legacyUser.getEmailVerifiedAt(),
                legacyUser.getDeactivatedAt(),
                legacyUser.getCreatedAt(),
                Instant.now()
        );
        identityUser = identityUserRepository.save(identityUser);
        final IdentityUser persistedIdentityUser = identityUser;

        Organization organization = legacyUser.getOrganization();
        OrganizationMembership membership = organizationMembershipRepository.findByLegacyUserId(legacyUser.getId())
                .or(() -> organizationMembershipRepository.findByIdentityUserIdAndOrganizationId(persistedIdentityUser.getId(), organization.getId()))
                .orElseGet(() -> new OrganizationMembership(
                        persistedIdentityUser,
                        organization,
                        legacyUser.getId(),
                        legacyUser.getRole(),
                        membershipStatusFor(legacyUser),
                        false,
                        legacyUser.getCreatedAt(),
                        legacyUser.getDeactivatedAt(),
                        legacyUser.getCreatedAt(),
                        legacyUser.getCreatedAt()
                ));

        membership.syncFromLegacy(
                legacyUser.getId(),
                legacyUser.getRole(),
                membershipStatusFor(legacyUser),
                legacyUser.getCreatedAt(),
                legacyUser.getDeactivatedAt(),
                Instant.now()
        );
        organizationMembershipRepository.save(membership);
    }

    private OrganizationMembershipStatus membershipStatusFor(UserAccount user) {
        return user.getDeactivatedAt() == null
                ? OrganizationMembershipStatus.ACTIVE
                : OrganizationMembershipStatus.REMOVED;
    }
}

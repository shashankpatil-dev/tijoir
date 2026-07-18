package com.tijoir.identity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationMembershipRepository extends JpaRepository<OrganizationMembership, UUID> {
    Optional<OrganizationMembership> findByLegacyUserId(UUID legacyUserId);

    Optional<OrganizationMembership> findByIdentityUserIdAndOrganizationId(UUID identityUserId, UUID organizationId);

    List<OrganizationMembership> findAllByIdentityUserId(UUID identityUserId);

    List<OrganizationMembership> findAllByIdentityUserIdOrderByJoinedAtAsc(UUID identityUserId);
}

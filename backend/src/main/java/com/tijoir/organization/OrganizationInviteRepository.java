package com.tijoir.organization;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationInviteRepository extends JpaRepository<OrganizationInvite, UUID>, JpaSpecificationExecutor<OrganizationInvite> {
    List<OrganizationInvite> findAllByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    @Query("""
            select count(invite)
            from OrganizationInvite invite
            where invite.organization.id = :organizationId
              and invite.revokedAt is null
              and invite.acceptedAt is null
              and invite.expiresAt > :now
            """)
    long countPendingByOrganizationId(@Param("organizationId") UUID organizationId, @Param("now") Instant now);

    Optional<OrganizationInvite> findByIdAndOrganizationId(UUID id, UUID organizationId);

    Optional<OrganizationInvite> findByTokenHash(String tokenHash);
}

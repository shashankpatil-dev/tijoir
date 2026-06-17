package com.tijoir.organization;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationInviteRepository extends JpaRepository<OrganizationInvite, UUID>, JpaSpecificationExecutor<OrganizationInvite> {
    List<OrganizationInvite> findAllByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    Optional<OrganizationInvite> findByIdAndOrganizationId(UUID id, UUID organizationId);

    Optional<OrganizationInvite> findByTokenHash(String tokenHash);
}

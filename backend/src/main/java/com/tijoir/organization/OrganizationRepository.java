package com.tijoir.organization;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    boolean existsByEmailIgnoreCase(String email);

    boolean existsBySlug(String slug);

    Optional<Organization> findBySlug(String slug);
}


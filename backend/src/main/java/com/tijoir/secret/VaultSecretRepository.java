package com.tijoir.secret;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VaultSecretRepository extends JpaRepository<VaultSecret, UUID>, JpaSpecificationExecutor<VaultSecret> {
    boolean existsByOrganizationIdAndSecretKey(UUID organizationId, String secretKey);

    long countByOrganizationId(UUID organizationId);

    List<VaultSecret> findAllByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    Optional<VaultSecret> findFirstByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    Optional<VaultSecret> findByIdAndOrganizationId(UUID id, UUID organizationId);
}

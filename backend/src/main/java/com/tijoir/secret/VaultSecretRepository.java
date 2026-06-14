package com.tijoir.secret;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VaultSecretRepository extends JpaRepository<VaultSecret, UUID> {
    boolean existsByOrganizationIdAndSecretKey(UUID organizationId, String secretKey);

    List<VaultSecret> findAllByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    Optional<VaultSecret> findByIdAndOrganizationId(UUID id, UUID organizationId);
}

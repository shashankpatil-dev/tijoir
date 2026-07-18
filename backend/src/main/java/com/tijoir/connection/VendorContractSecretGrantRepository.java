package com.tijoir.connection;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VendorContractSecretGrantRepository extends JpaRepository<VendorContractSecretGrant, UUID>, JpaSpecificationExecutor<VendorContractSecretGrant> {
    Optional<VendorContractSecretGrant> findByIdAndOrganizationId(UUID id, UUID organizationId);

    Page<VendorContractSecretGrant> findAllByContractId(UUID contractId, Pageable pageable);

    List<VendorContractSecretGrant> findAllByContractIdAndStatus(UUID contractId, VendorContractGrantStatus status);

    boolean existsByContractIdAndSecretIdAndStatus(UUID contractId, UUID secretId, VendorContractGrantStatus status);
}

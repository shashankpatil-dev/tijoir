package com.tijoir.connection;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VendorAccessContractRepository extends JpaRepository<VendorAccessContract, UUID>, JpaSpecificationExecutor<VendorAccessContract> {
    Optional<VendorAccessContract> findByIdAndOrganizationId(UUID id, UUID organizationId);

    List<VendorAccessContract> findAllByVendorIdAndStatus(UUID vendorId, VendorAccessContractStatus status);

}

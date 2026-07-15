package com.tijoir.organization;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserAccountRepository extends JpaRepository<UserAccount, UUID>, JpaSpecificationExecutor<UserAccount> {
    boolean existsByEmailIgnoreCaseAndDeactivatedAtIsNull(String email);

    long countByOrganizationIdAndDeactivatedAtIsNull(UUID organizationId);

    Optional<UserAccount> findByEmailIgnoreCaseAndDeactivatedAtIsNull(String email);

    Optional<UserAccount> findByGoogleSubAndDeactivatedAtIsNull(String googleSub);

    Optional<UserAccount> findByIdAndDeactivatedAtIsNull(UUID id);

    Optional<UserAccount> findByIdAndOrganizationIdAndDeactivatedAtIsNull(UUID id, UUID organizationId);

    List<UserAccount> findAllByOrganizationIdAndDeactivatedAtIsNullOrderByCreatedAtAsc(UUID organizationId);
}

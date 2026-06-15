package com.tijoir.organization;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserAccountRepository extends JpaRepository<UserAccount, UUID> {
    boolean existsByEmailIgnoreCaseAndDeactivatedAtIsNull(String email);

    Optional<UserAccount> findByEmailIgnoreCaseAndDeactivatedAtIsNull(String email);

    Optional<UserAccount> findByIdAndDeactivatedAtIsNull(UUID id);

    Optional<UserAccount> findByIdAndOrganizationIdAndDeactivatedAtIsNull(UUID id, UUID organizationId);

    List<UserAccount> findAllByOrganizationIdAndDeactivatedAtIsNullOrderByCreatedAtAsc(UUID organizationId);
}

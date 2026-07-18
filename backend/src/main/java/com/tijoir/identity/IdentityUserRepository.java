package com.tijoir.identity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface IdentityUserRepository extends JpaRepository<IdentityUser, UUID> {
    Optional<IdentityUser> findByLegacyUserId(UUID legacyUserId);

    Optional<IdentityUser> findByEmailIgnoreCase(String email);

    Optional<IdentityUser> findByGoogleSub(String googleSub);
}

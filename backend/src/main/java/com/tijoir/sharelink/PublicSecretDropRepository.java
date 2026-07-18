package com.tijoir.sharelink;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface PublicSecretDropRepository extends JpaRepository<PublicSecretDrop, UUID> {
    Optional<PublicSecretDrop> findByTokenHash(String tokenHash);

    Optional<PublicSecretDrop> findByManageTokenHash(String manageTokenHash);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select drop from PublicSecretDrop drop where drop.tokenHash = :tokenHash")
    Optional<PublicSecretDrop> findByTokenHashForUpdate(@Param("tokenHash") String tokenHash);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select drop from PublicSecretDrop drop where drop.manageTokenHash = :manageTokenHash")
    Optional<PublicSecretDrop> findByManageTokenHashForUpdate(@Param("manageTokenHash") String manageTokenHash);
}

package com.tijoir.secret;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SecretVersionRepository extends JpaRepository<SecretVersion, UUID> {
    Optional<SecretVersion> findBySecretIdAndVersionNumber(UUID secretId, int versionNumber);

    List<SecretVersion> findBySecretIdOrderByVersionNumberDesc(UUID secretId);
}

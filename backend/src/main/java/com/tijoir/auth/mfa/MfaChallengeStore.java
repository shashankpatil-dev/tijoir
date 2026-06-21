package com.tijoir.auth.mfa;

import java.time.Duration;
import java.util.Optional;

public interface MfaChallengeStore {
    Optional<StoredMfaChallenge> get(String key);

    void put(String key, StoredMfaChallenge challenge, Duration ttl);

    void delete(String key);
}

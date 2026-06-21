package com.tijoir.auth.mfa;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

public class InMemoryMfaChallengeStore implements MfaChallengeStore {
    private final ConcurrentHashMap<String, TimedChallenge> challenges = new ConcurrentHashMap<>();

    @Override
    public synchronized Optional<StoredMfaChallenge> get(String key) {
        TimedChallenge challenge = challenges.get(key);
        if (challenge == null) {
            return Optional.empty();
        }
        if (!challenge.expiresAt().isAfter(Instant.now())) {
            challenges.remove(key);
            return Optional.empty();
        }
        return Optional.of(challenge.challenge());
    }

    @Override
    public synchronized void put(String key, StoredMfaChallenge challenge, Duration ttl) {
        challenges.put(key, new TimedChallenge(challenge, Instant.now().plus(ttl)));
    }

    @Override
    public synchronized void delete(String key) {
        challenges.remove(key);
    }

    private record TimedChallenge(StoredMfaChallenge challenge, Instant expiresAt) {
    }
}

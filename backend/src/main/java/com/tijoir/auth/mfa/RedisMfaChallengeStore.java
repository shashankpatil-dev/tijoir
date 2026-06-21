package com.tijoir.auth.mfa;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.io.IOException;
import java.time.Duration;
import java.util.Optional;

public class RedisMfaChallengeStore implements MfaChallengeStore {
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    public RedisMfaChallengeStore(StringRedisTemplate stringRedisTemplate, ObjectMapper objectMapper) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public Optional<StoredMfaChallenge> get(String key) {
        String raw = stringRedisTemplate.opsForValue().get(key);
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(objectMapper.readValue(raw, StoredMfaChallenge.class));
        } catch (IOException exception) {
            throw new IllegalStateException("Could not deserialize MFA challenge", exception);
        }
    }

    @Override
    public void put(String key, StoredMfaChallenge challenge, Duration ttl) {
        try {
            stringRedisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(challenge), ttl);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not serialize MFA challenge", exception);
        }
    }

    @Override
    public void delete(String key) {
        stringRedisTemplate.delete(key);
    }
}

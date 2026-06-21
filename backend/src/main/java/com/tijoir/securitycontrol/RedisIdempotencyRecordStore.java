package com.tijoir.securitycontrol;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Optional;

@Component
@Profile("prod")
public class RedisIdempotencyRecordStore implements IdempotencyRecordStore {
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    public RedisIdempotencyRecordStore(StringRedisTemplate stringRedisTemplate, ObjectMapper objectMapper) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public Optional<StoredIdempotencyRecord> get(String key) {
        String raw = stringRedisTemplate.opsForValue().get(key);
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(objectMapper.readValue(raw, StoredIdempotencyRecord.class));
        } catch (IOException exception) {
            throw new IllegalStateException("Could not deserialize idempotency record", exception);
        }
    }

    @Override
    public void save(String key, StoredIdempotencyRecord record, Duration ttl) {
        try {
            stringRedisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(record), ttl);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not serialize idempotency record", exception);
        }
    }

    @Override
    public boolean acquireLock(String key, Duration ttl) {
        return Boolean.TRUE.equals(stringRedisTemplate.opsForValue().setIfAbsent(key, "1", ttl));
    }

    @Override
    public void releaseLock(String key) {
        stringRedisTemplate.delete(key);
    }
}

package com.tijoir.securitycontrol;

import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

@Component
@Profile("prod")
public class RedisReadModelCacheStore implements ReadModelCacheStore {
    private final StringRedisTemplate stringRedisTemplate;

    public RedisReadModelCacheStore(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    @Override
    public Optional<String> get(String key) {
        String value = stringRedisTemplate.opsForValue().get(key);
        return value == null || value.isBlank() ? Optional.empty() : Optional.of(value);
    }

    @Override
    public void put(String key, String value, Duration ttl) {
        stringRedisTemplate.opsForValue().set(key, value, ttl);
    }

    @Override
    public void evict(String key) {
        stringRedisTemplate.delete(key);
    }
}

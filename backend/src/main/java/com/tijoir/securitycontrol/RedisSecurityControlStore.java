package com.tijoir.securitycontrol;

import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

@Component
@Profile("prod")
public class RedisSecurityControlStore implements SecurityControlStore {
    private final StringRedisTemplate stringRedisTemplate;

    public RedisSecurityControlStore(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    @Override
    public CounterState increment(String key, Duration ttl) {
        Long value = stringRedisTemplate.opsForValue().increment(key);
        if (value == null) {
            throw new IllegalStateException("Redis increment returned null");
        }
        if (value == 1L) {
            stringRedisTemplate.expire(key, ttl);
        }
        return new CounterState(value, ttl(key).orElse(ttl));
    }

    @Override
    public void put(String key, Duration ttl) {
        stringRedisTemplate.opsForValue().set(key, "1", ttl);
    }

    @Override
    public Optional<Duration> ttl(String key) {
        Long seconds = stringRedisTemplate.getExpire(key);
        if (seconds == null || seconds < 0) {
            return Optional.empty();
        }
        return Optional.of(Duration.ofSeconds(seconds));
    }

    @Override
    public void delete(String key) {
        stringRedisTemplate.delete(key);
    }
}

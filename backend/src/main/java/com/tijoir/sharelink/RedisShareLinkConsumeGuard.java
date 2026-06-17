package com.tijoir.sharelink;

import com.tijoir.common.exception.ApiException;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@Profile("!test")
public class RedisShareLinkConsumeGuard implements ShareLinkConsumeGuard {
    private static final Duration LOCK_TTL = Duration.ofSeconds(30);
    private static final String KEY_PREFIX = "tijoir:share-link-consume:";

    private final StringRedisTemplate stringRedisTemplate;

    public RedisShareLinkConsumeGuard(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    @Override
    public GuardLease acquire(String tokenHash) {
        String key = KEY_PREFIX + tokenHash;
        Boolean acquired = stringRedisTemplate.opsForValue().setIfAbsent(key, "1", LOCK_TTL);
        if (!Boolean.TRUE.equals(acquired)) {
            throw new ApiException(HttpStatus.CONFLICT, "Share link consumption is already in progress");
        }
        return () -> stringRedisTemplate.delete(key);
    }
}

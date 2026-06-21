package com.tijoir.securitycontrol;

import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Primary
@Profile("!prod")
public class InMemoryReadModelCacheStore implements ReadModelCacheStore {
    private final ConcurrentHashMap<String, TimedValue> values = new ConcurrentHashMap<>();

    @Override
    public synchronized Optional<String> get(String key) {
        TimedValue timedValue = values.get(key);
        if (timedValue == null) {
            return Optional.empty();
        }
        if (!timedValue.expiresAt().isAfter(Instant.now())) {
            values.remove(key);
            return Optional.empty();
        }
        return Optional.of(timedValue.value());
    }

    @Override
    public synchronized void put(String key, String value, Duration ttl) {
        values.put(key, new TimedValue(value, Instant.now().plus(ttl)));
    }

    @Override
    public synchronized void evict(String key) {
        values.remove(key);
    }

    private record TimedValue(String value, Instant expiresAt) {
    }
}

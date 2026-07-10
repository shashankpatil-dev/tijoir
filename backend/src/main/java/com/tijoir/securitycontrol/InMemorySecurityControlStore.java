package com.tijoir.securitycontrol;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class InMemorySecurityControlStore implements SecurityControlStore {
    private final ConcurrentHashMap<String, Entry> entries = new ConcurrentHashMap<>();

    @Override
    public synchronized CounterState increment(String key, Duration ttl) {
        Entry current = liveEntry(key);
        if (current == null) {
            Entry created = new Entry(1, Instant.now().plus(ttl));
            entries.put(key, created);
            return new CounterState(created.value(), ttl);
        }

        Entry updated = new Entry(current.value() + 1, current.expiresAt());
        entries.put(key, updated);
        return new CounterState(updated.value(), Duration.between(Instant.now(), updated.expiresAt()));
    }

    @Override
    public synchronized void put(String key, Duration ttl) {
        entries.put(key, new Entry(1, Instant.now().plus(ttl)));
    }

    @Override
    public synchronized Optional<Duration> ttl(String key) {
        Entry current = liveEntry(key);
        if (current == null) {
            return Optional.empty();
        }
        return Optional.of(Duration.between(Instant.now(), current.expiresAt()));
    }

    @Override
    public synchronized void delete(String key) {
        entries.remove(key);
    }

    private Entry liveEntry(String key) {
        Entry current = entries.get(key);
        if (current == null) {
            return null;
        }
        if (!current.expiresAt().isAfter(Instant.now())) {
            entries.remove(key);
            return null;
        }
        return current;
    }

    private record Entry(long value, Instant expiresAt) {
    }
}

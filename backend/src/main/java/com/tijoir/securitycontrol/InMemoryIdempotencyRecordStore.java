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
public class InMemoryIdempotencyRecordStore implements IdempotencyRecordStore {
    private final ConcurrentHashMap<String, TimedRecord> records = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Instant> locks = new ConcurrentHashMap<>();

    @Override
    public synchronized Optional<StoredIdempotencyRecord> get(String key) {
        TimedRecord record = records.get(key);
        if (record == null) {
            return Optional.empty();
        }
        if (!record.expiresAt().isAfter(Instant.now())) {
            records.remove(key);
            return Optional.empty();
        }
        return Optional.of(record.record());
    }

    @Override
    public synchronized void save(String key, StoredIdempotencyRecord record, Duration ttl) {
        records.put(key, new TimedRecord(record, Instant.now().plus(ttl)));
    }

    @Override
    public synchronized boolean acquireLock(String key, Duration ttl) {
        Instant current = locks.get(key);
        if (current != null && current.isAfter(Instant.now())) {
            return false;
        }
        locks.put(key, Instant.now().plus(ttl));
        return true;
    }

    @Override
    public synchronized void releaseLock(String key) {
        locks.remove(key);
    }

    private record TimedRecord(StoredIdempotencyRecord record, Instant expiresAt) {
    }
}

package com.tijoir.securitycontrol;

import java.time.Duration;
import java.util.Optional;

public interface IdempotencyRecordStore {
    Optional<StoredIdempotencyRecord> get(String key);

    void save(String key, StoredIdempotencyRecord record, Duration ttl);

    boolean acquireLock(String key, Duration ttl);

    void releaseLock(String key);
}

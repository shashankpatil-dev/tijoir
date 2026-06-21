package com.tijoir.securitycontrol;

import java.time.Duration;
import java.util.Optional;

public interface ReadModelCacheStore {
    Optional<String> get(String key);

    void put(String key, String value, Duration ttl);

    void evict(String key);
}

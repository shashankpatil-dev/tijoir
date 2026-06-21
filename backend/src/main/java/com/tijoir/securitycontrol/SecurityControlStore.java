package com.tijoir.securitycontrol;

import java.time.Duration;
import java.util.Optional;

public interface SecurityControlStore {
    CounterState increment(String key, Duration ttl);

    void put(String key, Duration ttl);

    Optional<Duration> ttl(String key);

    void delete(String key);

    record CounterState(long value, Duration ttl) {
    }
}

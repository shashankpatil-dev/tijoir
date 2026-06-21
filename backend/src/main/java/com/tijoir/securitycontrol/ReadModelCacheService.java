package com.tijoir.securitycontrol;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Duration;
import java.util.Optional;

@Service
public class ReadModelCacheService {
    private final ReadModelCacheStore readModelCacheStore;
    private final ObjectMapper objectMapper;

    public ReadModelCacheService(ReadModelCacheStore readModelCacheStore, ObjectMapper objectMapper) {
        this.readModelCacheStore = readModelCacheStore;
        this.objectMapper = objectMapper;
    }

    public <T> Optional<T> get(String key, Class<T> type) {
        return readModelCacheStore.get(key).map(raw -> deserialize(raw, type));
    }

    public void put(String key, Object value, Duration ttl) {
        readModelCacheStore.put(key, serialize(value), ttl);
    }

    public void evict(String key) {
        readModelCacheStore.evict(key);
    }

    private String serialize(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not serialize cached read model", exception);
        }
    }

    private <T> T deserialize(String raw, Class<T> type) {
        try {
            return objectMapper.readValue(raw, type);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not deserialize cached read model", exception);
        }
    }
}

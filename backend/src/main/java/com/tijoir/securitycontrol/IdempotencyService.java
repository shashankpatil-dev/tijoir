package com.tijoir.securitycontrol;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.common.exception.ApiException;
import com.tijoir.common.util.CryptoUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Duration;
import java.util.function.Supplier;

@Service
public class IdempotencyService {
    private static final Logger log = LoggerFactory.getLogger(IdempotencyService.class);

    private final IdempotencyRecordStore recordStore;
    private final RedisSecurityProperties properties;
    private final ObjectMapper objectMapper;

    public IdempotencyService(
            IdempotencyRecordStore recordStore,
            RedisSecurityProperties properties,
            ObjectMapper objectMapper
    ) {
        this.recordStore = recordStore;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public <T> IdempotentResponse<T> execute(
            AuthenticatedUser actor,
            String scope,
            String idempotencyKey,
            Object fingerprint,
            Class<T> responseType,
            Supplier<IdempotentResponse<T>> supplier
    ) {
        if (!properties.isEnabled() || !properties.getIdempotency().isEnabled()) {
            return supplier.get();
        }
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return supplier.get();
        }

        String normalizedKey = idempotencyKey.trim();
        String requestHash = hashFingerprint(fingerprint);
        String recordKey = recordKey(actor, scope, normalizedKey);
        String lockKey = recordKey + ":lock";

        try {
            StoredIdempotencyRecord existing = recordStore.get(recordKey).orElse(null);
            if (existing != null) {
                if (!existing.requestHash().equals(requestHash)) {
                    throw new ApiException(HttpStatus.CONFLICT, "Idempotency key was already used for a different request");
                }
                return replay(existing, responseType);
            }

            Duration lockTtl = Duration.ofSeconds(properties.getIdempotency().getLockSeconds());
            if (!recordStore.acquireLock(lockKey, lockTtl)) {
                throw new ApiException(HttpStatus.CONFLICT, "A request with this idempotency key is already in progress");
            }

            try {
                IdempotentResponse<T> response = supplier.get();
                Duration recordTtl = Duration.ofHours(properties.getIdempotency().getTtlHours());
                recordStore.save(recordKey, storeRecord(requestHash, response.body(), response.status()), recordTtl);
                return response;
            } finally {
                recordStore.releaseLock(lockKey);
            }
        } catch (ApiException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            log.warn("Failing open for idempotency scope {}", scope, exception);
            return supplier.get();
        }
    }

    private <T> IdempotentResponse<T> replay(StoredIdempotencyRecord record, Class<T> responseType) {
        try {
            T body = objectMapper.readValue(record.bodyJson(), responseType);
            return new IdempotentResponse<>(HttpStatus.valueOf(record.statusCode()), body, true);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not deserialize idempotent response body", exception);
        }
    }

    private StoredIdempotencyRecord storeRecord(String requestHash, Object body, HttpStatus status) {
        try {
            return new StoredIdempotencyRecord(
                    requestHash,
                    status.value(),
                    objectMapper.writeValueAsString(body)
            );
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not serialize idempotent response body", exception);
        }
    }

    private String hashFingerprint(Object fingerprint) {
        try {
            return CryptoUtil.sha256Hex(objectMapper.writeValueAsString(fingerprint));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not hash idempotency fingerprint", exception);
        }
    }

    private String recordKey(AuthenticatedUser actor, String scope, String idempotencyKey) {
        String namespacedKey = "%s:%s:%s:%s".formatted(
                actor.organizationId(),
                actor.userId(),
                scope,
                idempotencyKey
        );
        return "tijoir:idempotency:%s".formatted(CryptoUtil.sha256Hex(namespacedKey));
    }
}

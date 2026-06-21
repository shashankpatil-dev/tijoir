package com.tijoir.securitycontrol;

import com.tijoir.common.util.CryptoUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Locale;

@Service
public class AbuseProtectionService {
    private static final Logger log = LoggerFactory.getLogger(AbuseProtectionService.class);

    private final SecurityControlStore store;
    private final RedisSecurityProperties properties;

    public AbuseProtectionService(SecurityControlStore store, RedisSecurityProperties properties) {
        this.store = store;
        this.properties = properties;
    }

    public void assertNotCoolingDown(String scope, String identifier, String message) {
        if (!properties.isEnabled() || !properties.getAbuseProtection().isEnabled()) {
            return;
        }

        try {
            Duration remaining = store.ttl(cooldownKey(scope, identifier)).orElse(null);
            if (remaining != null) {
                throw new RateLimitException(message, Math.max(remaining.toSeconds(), 1));
            }
        } catch (RateLimitException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            log.warn("Failing open for abuse cooldown scope {}", scope, exception);
        }
    }

    public boolean recordFailure(String scope, String identifier, AbuseCooldownRule rule) {
        if (!properties.isEnabled() || !properties.getAbuseProtection().isEnabled()) {
            return false;
        }

        try {
            SecurityControlStore.CounterState state = store.increment(failureKey(scope, identifier), rule.window());
            if (state.value() >= rule.threshold()) {
                store.put(cooldownKey(scope, identifier), rule.cooldown());
                return true;
            }
            return false;
        } catch (RuntimeException exception) {
            log.warn("Failing open while recording abuse scope {}", scope, exception);
            return false;
        }
    }

    public void clearFailures(String scope, String identifier) {
        if (!properties.isEnabled() || !properties.getAbuseProtection().isEnabled()) {
            return;
        }

        try {
            store.delete(failureKey(scope, identifier));
            store.delete(cooldownKey(scope, identifier));
        } catch (RuntimeException exception) {
            log.warn("Failing open while clearing abuse scope {}", scope, exception);
        }
    }

    public void assertTriggeredCooldown(String message, AbuseCooldownRule rule) {
        throw new RateLimitException(message, Math.max(rule.cooldown().toSeconds(), 1));
    }

    private String failureKey(String scope, String identifier) {
        return "tijoir:abuse:failure:%s:%s".formatted(scope, normalizeIdentifier(identifier));
    }

    private String cooldownKey(String scope, String identifier) {
        return "tijoir:abuse:cooldown:%s:%s".formatted(scope, normalizeIdentifier(identifier));
    }

    private String normalizeIdentifier(String identifier) {
        return CryptoUtil.sha256Hex(identifier.toLowerCase(Locale.ROOT));
    }
}

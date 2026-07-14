package com.tijoir.securitycontrol;

import com.tijoir.common.util.CryptoUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Locale;
import java.util.Set;

@Service
public class RateLimitEnforcer {
    private static final Logger log = LoggerFactory.getLogger(RateLimitEnforcer.class);

    /**
     * Scopes that must FAIL CLOSED: if the counter store errors we deny the request rather
     * than allow it, because these guard brute-force / abuse where an open failure is unsafe.
     * Other (non-abuse) scopes fail open so a store hiccup does not lock out normal traffic.
     */
    private static final Set<String> FAIL_CLOSED_SCOPES = Set.of(
            "auth-login-failure-ip",
            "public-share-consume-ip",
            "public-share-consume-token",
            "public-share-invalid-token-ip"
    );

    private final SecurityControlStore store;

    public RateLimitEnforcer(SecurityControlStore store) {
        this.store = store;
    }

    public void assertWithinLimit(String scope, String identifier, RateLimitRule rule) {
        try {
            SecurityControlStore.CounterState state = store.increment(rateKey(scope, identifier), rule.window());
            if (state.value() > rule.limit()) {
                throw new RateLimitException(rule.message(), toRetryAfterSeconds(state.ttl(), rule.window()));
            }
        } catch (RateLimitException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            if (FAIL_CLOSED_SCOPES.contains(scope)) {
                log.warn("Failing closed for rate limit scope {} after store error", scope, exception);
                throw new RateLimitException(rule.message(), Math.max(rule.window().toSeconds(), 1));
            }
            log.warn("Failing open for rate limit scope {}", scope, exception);
        }
    }

    private String rateKey(String scope, String identifier) {
        return "tijoir:rate-limit:%s:%s".formatted(scope, CryptoUtil.sha256Hex(identifier.toLowerCase(Locale.ROOT)));
    }

    private long toRetryAfterSeconds(Duration remaining, Duration fallback) {
        Duration effective = remaining == null || remaining.isNegative() || remaining.isZero() ? fallback : remaining;
        return Math.max(effective.toSeconds(), 1);
    }
}

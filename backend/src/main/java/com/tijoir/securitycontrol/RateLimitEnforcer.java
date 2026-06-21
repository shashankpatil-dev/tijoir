package com.tijoir.securitycontrol;

import com.tijoir.common.util.CryptoUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Locale;

@Service
public class RateLimitEnforcer {
    private static final Logger log = LoggerFactory.getLogger(RateLimitEnforcer.class);

    private final SecurityControlStore store;
    private final RedisSecurityProperties properties;

    public RateLimitEnforcer(SecurityControlStore store, RedisSecurityProperties properties) {
        this.store = store;
        this.properties = properties;
    }

    public void assertWithinLimit(String scope, String identifier, RateLimitRule rule) {
        if (!properties.isEnabled() || !properties.getRateLimit().isEnabled()) {
            return;
        }

        try {
            SecurityControlStore.CounterState state = store.increment(rateKey(scope, identifier), rule.window());
            if (state.value() > rule.limit()) {
                throw new RateLimitException(rule.message(), toRetryAfterSeconds(state.ttl(), rule.window()));
            }
        } catch (RateLimitException exception) {
            throw exception;
        } catch (RuntimeException exception) {
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

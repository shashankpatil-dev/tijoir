package com.tijoir.securitycontrol;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "tijoir.redis")
public class RedisSecurityProperties {
    private boolean enabled;
    private final Feature shareLinkLock = new Feature();
    private final Feature rateLimit = new Feature();
    private final IdempotencyFeature idempotency = new IdempotencyFeature();
    private final Feature summaryCache = new Feature();
    private final Feature policyCache = new Feature();
    private final Feature abuseProtection = new Feature();
    private final Feature mfa = new Feature();

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public Feature getShareLinkLock() {
        return shareLinkLock;
    }

    public Feature getRateLimit() {
        return rateLimit;
    }

    public IdempotencyFeature getIdempotency() {
        return idempotency;
    }

    public Feature getSummaryCache() {
        return summaryCache;
    }

    public Feature getPolicyCache() {
        return policyCache;
    }

    public Feature getAbuseProtection() {
        return abuseProtection;
    }

    public Feature getMfa() {
        return mfa;
    }

    public static class Feature {
        private boolean enabled;

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }
    }

    public static class IdempotencyFeature extends Feature {
        private long ttlHours = 24;
        private long lockSeconds = 30;

        public long getTtlHours() {
            return ttlHours;
        }

        public void setTtlHours(long ttlHours) {
            this.ttlHours = ttlHours;
        }

        public long getLockSeconds() {
            return lockSeconds;
        }

        public void setLockSeconds(long lockSeconds) {
            this.lockSeconds = lockSeconds;
        }
    }
}

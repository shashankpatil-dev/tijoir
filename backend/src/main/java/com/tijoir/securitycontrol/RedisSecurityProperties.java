package com.tijoir.securitycontrol;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "tijoir.redis")
public class RedisSecurityProperties {
    private boolean enabled;
    private final Feature shareLinkLock = new Feature();
    private final Feature rateLimit = new Feature();
    private final IdempotencyFeature idempotency = new IdempotencyFeature();
    private final TimedFeature summaryCache = new TimedFeature(20);
    private final TimedFeature policyCache = new TimedFeature(60);
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

    public TimedFeature getSummaryCache() {
        return summaryCache;
    }

    public TimedFeature getPolicyCache() {
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

    public static class TimedFeature extends Feature {
        private long ttlSeconds;

        public TimedFeature() {
        }

        public TimedFeature(long ttlSeconds) {
            this.ttlSeconds = ttlSeconds;
        }

        public long getTtlSeconds() {
            return ttlSeconds;
        }

        public void setTtlSeconds(long ttlSeconds) {
            this.ttlSeconds = ttlSeconds;
        }
    }
}

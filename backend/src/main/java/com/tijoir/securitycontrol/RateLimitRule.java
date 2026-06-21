package com.tijoir.securitycontrol;

import java.time.Duration;

public record RateLimitRule(
        int limit,
        Duration window,
        String message
) {
}

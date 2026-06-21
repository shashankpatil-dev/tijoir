package com.tijoir.securitycontrol;

import java.time.Duration;

public record AbuseCooldownRule(
        int threshold,
        Duration window,
        Duration cooldown,
        String message
) {
}

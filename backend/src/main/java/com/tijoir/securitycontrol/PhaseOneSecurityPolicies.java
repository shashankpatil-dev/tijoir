package com.tijoir.securitycontrol;

import java.time.Duration;

public final class PhaseOneSecurityPolicies {
    private PhaseOneSecurityPolicies() {
    }

    public static final RateLimitRule REGISTER_PER_IP =
            new RateLimitRule(200, Duration.ofHours(1), "Too many registration attempts. Try again later.");
    public static final RateLimitRule LOGIN_PER_IP =
            new RateLimitRule(200, Duration.ofMinutes(10), "Too many login attempts. Try again later.");
    public static final RateLimitRule REFRESH_PER_IP =
            new RateLimitRule(300, Duration.ofMinutes(15), "Too many session refresh attempts. Try again later.");
    public static final RateLimitRule RESEND_VERIFICATION_PER_IP =
            new RateLimitRule(50, Duration.ofHours(1), "Too many verification resend attempts. Try again later.");
    public static final RateLimitRule RESEND_VERIFICATION_PER_EMAIL =
            new RateLimitRule(3, Duration.ofHours(1), "Too many verification resend attempts for this email. Try again later.");
    public static final RateLimitRule VERIFY_EMAIL_PER_IP =
            new RateLimitRule(200, Duration.ofHours(1), "Too many verification attempts. Try again later.");
    public static final RateLimitRule VERIFY_EMAIL_PER_TOKEN =
            new RateLimitRule(10, Duration.ofHours(1), "Too many verification attempts for this token. Try again later.");
    public static final RateLimitRule PUBLIC_SHARE_METADATA_PER_IP =
            new RateLimitRule(300, Duration.ofMinutes(10), "Too many public share link lookups. Try again later.");
    public static final RateLimitRule PUBLIC_SHARE_METADATA_PER_TOKEN =
            new RateLimitRule(30, Duration.ofMinutes(10), "Too many public share link lookups for this token. Try again later.");
    public static final RateLimitRule PUBLIC_SHARE_CONSUME_PER_IP =
            new RateLimitRule(100, Duration.ofMinutes(10), "Too many share link reveal attempts. Try again later.");
    public static final RateLimitRule PUBLIC_SHARE_CONSUME_PER_TOKEN =
            new RateLimitRule(10, Duration.ofMinutes(10), "Too many share link reveal attempts for this token. Try again later.");
    public static final RateLimitRule LOGIN_FAILURE_PER_IP =
            new RateLimitRule(4, Duration.ofMinutes(15), "Too many failed login attempts from this network. Try again later.");
    public static final RateLimitRule INVALID_PUBLIC_SHARE_TOKEN_PER_IP =
            new RateLimitRule(4, Duration.ofMinutes(15), "Too many invalid public share link attempts. Try again later.");
}

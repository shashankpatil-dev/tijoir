package com.tijoir.securitycontrol;

import com.tijoir.auth.dto.LoginRequest;
import com.tijoir.auth.dto.RegisterRequest;
import com.tijoir.common.util.CryptoUtil;
import org.springframework.stereotype.Service;

@Service
public class AuthSecurityService {
    private final RateLimitEnforcer rateLimitEnforcer;

    public AuthSecurityService(RateLimitEnforcer rateLimitEnforcer) {
        this.rateLimitEnforcer = rateLimitEnforcer;
    }

    public void assertRegisterAllowed(RegisterRequest request, String clientIp) {
        rateLimitEnforcer.assertWithinLimit("auth-register-ip", clientIp, PhaseOneSecurityPolicies.REGISTER_PER_IP);
    }

    public void assertLoginAllowed(LoginRequest request, String clientIp) {
        rateLimitEnforcer.assertWithinLimit("auth-login-ip", clientIp, PhaseOneSecurityPolicies.LOGIN_PER_IP);
    }

    public void recordFailedLogin(LoginRequest request, String clientIp) {
        rateLimitEnforcer.assertWithinLimit("auth-login-failure-ip", clientIp, PhaseOneSecurityPolicies.LOGIN_FAILURE_PER_IP);
    }

    public void recordSuccessfulLogin(LoginRequest request, String clientIp) {
    }

    public void assertRefreshAllowed(String clientIp) {
        rateLimitEnforcer.assertWithinLimit("auth-refresh-ip", clientIp, PhaseOneSecurityPolicies.REFRESH_PER_IP);
    }

    public void assertResendVerificationAllowed(String email, String clientIp) {
        rateLimitEnforcer.assertWithinLimit("auth-resend-verification-ip", clientIp, PhaseOneSecurityPolicies.RESEND_VERIFICATION_PER_IP);
        rateLimitEnforcer.assertWithinLimit("auth-resend-verification-email", normalizeEmail(email), PhaseOneSecurityPolicies.RESEND_VERIFICATION_PER_EMAIL);
    }

    public void assertVerifyEmailAllowed(String token, String clientIp) {
        rateLimitEnforcer.assertWithinLimit("auth-verify-email-ip", clientIp, PhaseOneSecurityPolicies.VERIFY_EMAIL_PER_IP);
        rateLimitEnforcer.assertWithinLimit("auth-verify-email-token", tokenIdentity(token), PhaseOneSecurityPolicies.VERIFY_EMAIL_PER_TOKEN);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String tokenIdentity(String token) {
        return CryptoUtil.sha256Hex(token.trim());
    }
}

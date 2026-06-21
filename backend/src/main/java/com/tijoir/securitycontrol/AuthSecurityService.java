package com.tijoir.securitycontrol;

import com.tijoir.auth.dto.LoginRequest;
import com.tijoir.auth.dto.RegisterRequest;
import com.tijoir.common.util.CryptoUtil;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class AuthSecurityService {
    private final RateLimitEnforcer rateLimitEnforcer;
    private final AbuseProtectionService abuseProtectionService;

    public AuthSecurityService(RateLimitEnforcer rateLimitEnforcer, AbuseProtectionService abuseProtectionService) {
        this.rateLimitEnforcer = rateLimitEnforcer;
        this.abuseProtectionService = abuseProtectionService;
    }

    public void assertRegisterAllowed(RegisterRequest request, String clientIp) {
        rateLimitEnforcer.assertWithinLimit("auth-register-ip", clientIp, PhaseOneSecurityPolicies.REGISTER_PER_IP);
    }

    public void assertLoginAllowed(LoginRequest request, String clientIp) {
        rateLimitEnforcer.assertWithinLimit("auth-login-ip", clientIp, PhaseOneSecurityPolicies.LOGIN_PER_IP);

        String emailIpIdentity = emailIpIdentity(request.email(), clientIp);
        abuseProtectionService.assertNotCoolingDown(
                "auth-login-email-ip",
                emailIpIdentity,
                PhaseOneSecurityPolicies.LOGIN_FAILURE_PER_EMAIL_AND_IP.message()
        );
        abuseProtectionService.assertNotCoolingDown(
                "auth-login-ip",
                clientIp,
                PhaseOneSecurityPolicies.LOGIN_FAILURE_PER_IP.message()
        );
    }

    public void recordFailedLogin(LoginRequest request, String clientIp) {
        String emailIpIdentity = emailIpIdentity(request.email(), clientIp);
        boolean emailCooldownTriggered = abuseProtectionService.recordFailure(
                "auth-login-email-ip",
                emailIpIdentity,
                PhaseOneSecurityPolicies.LOGIN_FAILURE_PER_EMAIL_AND_IP
        );
        boolean ipCooldownTriggered = abuseProtectionService.recordFailure(
                "auth-login-ip",
                clientIp,
                PhaseOneSecurityPolicies.LOGIN_FAILURE_PER_IP
        );
        if (emailCooldownTriggered) {
            abuseProtectionService.assertTriggeredCooldown(
                    PhaseOneSecurityPolicies.LOGIN_FAILURE_PER_EMAIL_AND_IP.message(),
                    PhaseOneSecurityPolicies.LOGIN_FAILURE_PER_EMAIL_AND_IP
            );
        }
        if (ipCooldownTriggered) {
            abuseProtectionService.assertTriggeredCooldown(
                    PhaseOneSecurityPolicies.LOGIN_FAILURE_PER_IP.message(),
                    PhaseOneSecurityPolicies.LOGIN_FAILURE_PER_IP
            );
        }
    }

    public void recordSuccessfulLogin(LoginRequest request, String clientIp) {
        abuseProtectionService.clearFailures("auth-login-email-ip", emailIpIdentity(request.email(), clientIp));
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

    private String emailIpIdentity(String email, String clientIp) {
        return normalizeEmail(email) + ":" + clientIp.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String tokenIdentity(String token) {
        return CryptoUtil.sha256Hex(token.trim());
    }
}

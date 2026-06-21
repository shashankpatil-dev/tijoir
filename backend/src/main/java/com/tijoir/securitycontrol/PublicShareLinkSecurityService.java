package com.tijoir.securitycontrol;

import com.tijoir.common.util.CryptoUtil;
import org.springframework.stereotype.Service;

@Service
public class PublicShareLinkSecurityService {
    private final RateLimitEnforcer rateLimitEnforcer;
    private final AbuseProtectionService abuseProtectionService;

    public PublicShareLinkSecurityService(RateLimitEnforcer rateLimitEnforcer, AbuseProtectionService abuseProtectionService) {
        this.rateLimitEnforcer = rateLimitEnforcer;
        this.abuseProtectionService = abuseProtectionService;
    }

    public void assertMetadataAllowed(String token, String clientIp) {
        assertPublicProbeAllowed(clientIp);
        rateLimitEnforcer.assertWithinLimit("public-share-metadata-ip", clientIp, PhaseOneSecurityPolicies.PUBLIC_SHARE_METADATA_PER_IP);
        rateLimitEnforcer.assertWithinLimit("public-share-metadata-token", tokenIdentity(token), PhaseOneSecurityPolicies.PUBLIC_SHARE_METADATA_PER_TOKEN);
    }

    public void assertConsumeAllowed(String token, String clientIp) {
        assertPublicProbeAllowed(clientIp);
        rateLimitEnforcer.assertWithinLimit("public-share-consume-ip", clientIp, PhaseOneSecurityPolicies.PUBLIC_SHARE_CONSUME_PER_IP);
        rateLimitEnforcer.assertWithinLimit("public-share-consume-token", tokenIdentity(token), PhaseOneSecurityPolicies.PUBLIC_SHARE_CONSUME_PER_TOKEN);
    }

    public void recordMissingTokenProbe(String clientIp) {
        boolean cooldownTriggered = abuseProtectionService.recordFailure(
                "public-share-missing-token-ip",
                clientIp,
                PhaseOneSecurityPolicies.INVALID_PUBLIC_SHARE_TOKEN_PER_IP
        );
        if (cooldownTriggered) {
            abuseProtectionService.assertTriggeredCooldown(
                    PhaseOneSecurityPolicies.INVALID_PUBLIC_SHARE_TOKEN_PER_IP.message(),
                    PhaseOneSecurityPolicies.INVALID_PUBLIC_SHARE_TOKEN_PER_IP
            );
        }
    }

    public void clearMissingTokenProbe(String clientIp) {
        abuseProtectionService.clearFailures("public-share-missing-token-ip", clientIp);
    }

    private void assertPublicProbeAllowed(String clientIp) {
        abuseProtectionService.assertNotCoolingDown(
                "public-share-missing-token-ip",
                clientIp,
                PhaseOneSecurityPolicies.INVALID_PUBLIC_SHARE_TOKEN_PER_IP.message()
        );
    }

    private String tokenIdentity(String token) {
        return CryptoUtil.sha256Hex(token.trim());
    }
}

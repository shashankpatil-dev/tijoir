package com.tijoir.securitycontrol;

import com.tijoir.common.util.CryptoUtil;
import org.springframework.stereotype.Service;

@Service
public class PublicShareLinkSecurityService {
    private final RateLimitEnforcer rateLimitEnforcer;

    public PublicShareLinkSecurityService(RateLimitEnforcer rateLimitEnforcer) {
        this.rateLimitEnforcer = rateLimitEnforcer;
    }

    public void assertMetadataAllowed(String token, String clientIp) {
        rateLimitEnforcer.assertWithinLimit("public-share-metadata-ip", clientIp, PhaseOneSecurityPolicies.PUBLIC_SHARE_METADATA_PER_IP);
        rateLimitEnforcer.assertWithinLimit("public-share-metadata-token", tokenIdentity(token), PhaseOneSecurityPolicies.PUBLIC_SHARE_METADATA_PER_TOKEN);
    }

    public void assertConsumeAllowed(String token, String clientIp) {
        rateLimitEnforcer.assertWithinLimit("public-share-consume-ip", clientIp, PhaseOneSecurityPolicies.PUBLIC_SHARE_CONSUME_PER_IP);
        rateLimitEnforcer.assertWithinLimit("public-share-consume-token", tokenIdentity(token), PhaseOneSecurityPolicies.PUBLIC_SHARE_CONSUME_PER_TOKEN);
    }

    public void recordMissingTokenProbe(String clientIp) {
        rateLimitEnforcer.assertWithinLimit("public-share-invalid-token-ip", clientIp, PhaseOneSecurityPolicies.INVALID_PUBLIC_SHARE_TOKEN_PER_IP);
    }

    private String tokenIdentity(String token) {
        return CryptoUtil.sha256Hex(token.trim());
    }
}

package com.tijoir.securitycontrol;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Resolves the client IP used for rate limiting / abuse tracking.
 *
 * <p>By default forwarded headers are NOT trusted, because {@code X-Forwarded-For} /
 * {@code X-Real-IP} are attacker-controlled: a client can send an arbitrary value per
 * request and mint a fresh rate-limit bucket, defeating every limit. In that mode we use
 * only {@link HttpServletRequest#getRemoteAddr()}.
 *
 * <p>When the app runs behind a single trusted reverse proxy / load balancer, set
 * {@code tijoir.security.trust-forwarded-headers=true}. The trusted proxy appends the real
 * source as the RIGHT-most entry of {@code X-Forwarded-For}, so we take that (the left
 * entries remain client-spoofable and are ignored).
 */
@Component
public class ClientIpResolver {
    private final boolean trustForwardedHeaders;

    public ClientIpResolver(
            @Value("${tijoir.security.trust-forwarded-headers:false}") boolean trustForwardedHeaders
    ) {
        this.trustForwardedHeaders = trustForwardedHeaders;
    }

    public String resolve(HttpServletRequest request) {
        if (trustForwardedHeaders) {
            String forwardedFor = request.getHeader("X-Forwarded-For");
            if (forwardedFor != null && !forwardedFor.isBlank()) {
                String[] hops = forwardedFor.split(",");
                for (int i = hops.length - 1; i >= 0; i--) {
                    String hop = hops[i].trim();
                    if (!hop.isBlank()) {
                        return hop;
                    }
                }
            }

            String realIp = request.getHeader("X-Real-IP");
            if (realIp != null && !realIp.isBlank()) {
                return realIp.trim();
            }
        }

        String remoteAddress = request.getRemoteAddr();
        return remoteAddress != null && !remoteAddress.isBlank() ? remoteAddress : "unknown";
    }
}

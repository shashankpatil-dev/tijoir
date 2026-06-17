package com.tijoir.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Service
public class AuthCookieService {
    private final String refreshCookieName;
    private final boolean refreshCookieSecure;
    private final String refreshCookieSameSite;

    public AuthCookieService(
            @Value("${tijoir.security.refresh-cookie-name:tijoir_refresh}") String refreshCookieName,
            @Value("${tijoir.security.refresh-cookie-secure:false}") boolean refreshCookieSecure,
            @Value("${tijoir.security.refresh-cookie-same-site:Lax}") String refreshCookieSameSite
    ) {
        this.refreshCookieName = refreshCookieName;
        this.refreshCookieSecure = refreshCookieSecure;
        this.refreshCookieSameSite = refreshCookieSameSite;
    }

    public void writeRefreshCookie(HttpHeaders headers, String rawRefreshToken, Instant expiresAt) {
        long maxAgeSeconds = Math.max(Duration.between(Instant.now(), expiresAt).getSeconds(), 0);
        headers.add(HttpHeaders.SET_COOKIE, ResponseCookie.from(refreshCookieName, rawRefreshToken)
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .sameSite(refreshCookieSameSite)
                .path("/")
                .maxAge(Duration.ofSeconds(maxAgeSeconds))
                .build()
                .toString());
    }

    public void clearRefreshCookie(HttpHeaders headers) {
        headers.add(HttpHeaders.SET_COOKIE, ResponseCookie.from(refreshCookieName, "")
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .sameSite(refreshCookieSameSite)
                .path("/")
                .maxAge(Duration.ZERO)
                .build()
                .toString());
    }

    public String refreshCookieName() {
        return refreshCookieName;
    }
}

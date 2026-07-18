package com.tijoir.notification;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class NotificationLinkFactory {
    private final String publicBaseUrl;

    public NotificationLinkFactory(@Value("${tijoir.app.public-base-url}") String publicBaseUrl) {
        this.publicBaseUrl = trimTrailingSlash(publicBaseUrl);
    }

    public String verificationLink(String rawToken, String email) {
        return "%s/verify?token=%s&email=%s".formatted(
                publicBaseUrl,
                encode(rawToken),
                encode(email)
        );
    }

    public String inviteLink(String rawToken) {
        return "%s/invite?token=%s".formatted(publicBaseUrl, encode(rawToken));
    }

    public String passwordResetLink(String rawToken) {
        return "%s/reset?token=%s".formatted(publicBaseUrl, encode(rawToken));
    }

    public String dashboardVendorsLink() {
        return "%s/dashboard/vendors".formatted(publicBaseUrl);
    }

    private String trimTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}

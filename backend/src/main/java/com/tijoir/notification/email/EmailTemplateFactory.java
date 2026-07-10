package com.tijoir.notification.email;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

@Component
public class EmailTemplateFactory {
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME.withZone(ZoneOffset.UTC);

    public EmailMessage verificationMessage(
            String recipientEmail,
            String recipientName,
            String organizationName,
            String actionUrl,
            Instant expiresAt,
            boolean resend
    ) {
        String subject = resend ? "Your Tijoir verification link" : "Verify your Tijoir account";
        String body = """
                Hello %s,

                Verify your Tijoir account for %s by opening:
                %s

                This link expires at %s.

                If you did not initiate this request, you can ignore this email.
                """.formatted(
                safeName(recipientName),
                organizationName,
                actionUrl,
                FORMATTER.format(expiresAt)
        );
        return new EmailMessage(recipientEmail, subject, body);
    }

    public EmailMessage inviteMessage(
            String recipientEmail,
            String organizationName,
            String actionUrl,
            Instant expiresAt
    ) {
        String body = """
                Hello,

                You have been invited to join %s on Tijoir.

                Open this link to accept the invite and create your account:
                %s

                This invite expires at %s.
                """.formatted(
                organizationName,
                actionUrl,
                FORMATTER.format(expiresAt)
        );
        return new EmailMessage(recipientEmail, "You're invited to Tijoir", body);
    }

    private String safeName(String name) {
        return (name == null || name.isBlank()) ? "there" : name.trim();
    }
}

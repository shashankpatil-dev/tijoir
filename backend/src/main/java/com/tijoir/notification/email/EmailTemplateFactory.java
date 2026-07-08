package com.tijoir.notification.email;

import com.tijoir.notification.NotificationEvent;
import com.tijoir.notification.NotificationType;
import org.springframework.stereotype.Component;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

@Component
public class EmailTemplateFactory {
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME.withZone(ZoneOffset.UTC);

    public EmailMessage build(NotificationEvent event) {
        return switch (event.type()) {
            case EMAIL_VERIFICATION, EMAIL_VERIFICATION_RESEND -> verificationMessage(event);
            case ORGANIZATION_INVITE -> inviteMessage(event);
        };
    }

    private EmailMessage verificationMessage(NotificationEvent event) {
        String subject = event.type() == NotificationType.EMAIL_VERIFICATION_RESEND
                ? "Your Tijoir verification link"
                : "Verify your Tijoir account";
        String body = """
                Hello %s,

                Verify your Tijoir account for %s by opening:
                %s

                This link expires at %s.

                If you did not initiate this request, you can ignore this email.
                """.formatted(
                safeName(event.recipientName()),
                event.organizationName(),
                event.actionUrl(),
                FORMATTER.format(event.expiresAt())
        );
        return new EmailMessage(event.recipientEmail(), subject, body);
    }

    private EmailMessage inviteMessage(NotificationEvent event) {
        String body = """
                Hello,

                You have been invited to join %s on Tijoir.

                Open this link to accept the invite and create your account:
                %s

                This invite expires at %s.
                """.formatted(
                event.organizationName(),
                event.actionUrl(),
                FORMATTER.format(event.expiresAt())
        );
        return new EmailMessage(event.recipientEmail(), "You're invited to Tijoir", body);
    }

    private String safeName(String name) {
        return (name == null || name.isBlank()) ? "there" : name.trim();
    }
}

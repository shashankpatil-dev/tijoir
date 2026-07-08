package com.tijoir.notification;

import com.tijoir.organization.Organization;
import com.tijoir.organization.UserAccount;

import java.time.Instant;

public record NotificationEvent(
        NotificationType type,
        Organization organization,
        UserAccount user,
        String recipientEmail,
        String recipientName,
        String organizationName,
        String actionUrl,
        Instant expiresAt,
        boolean requestEmailDelivery
) {
}

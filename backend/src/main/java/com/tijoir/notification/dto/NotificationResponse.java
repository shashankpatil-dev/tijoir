package com.tijoir.notification.dto;

import com.tijoir.notification.NotificationEmailDeliveryStatus;
import com.tijoir.notification.NotificationType;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        NotificationType type,
        String title,
        String message,
        String actionUrl,
        String recipientEmail,
        NotificationEmailDeliveryStatus emailDeliveryStatus,
        Instant readAt,
        Instant deliveredAt,
        String emailDeliveryError,
        Instant createdAt
) {
}

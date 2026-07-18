package com.tijoir.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.tijoir.notification.NotificationEmailDeliveryStatus;

import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record RegisterResponse(
        AuthResponse auth,
        boolean verificationRequired,
        boolean verificationEmailRequested,
        String emailVerificationToken,
        Instant emailVerificationExpiresAt,
        NotificationEmailDeliveryStatus emailDeliveryStatus,
        Instant emailDeliveredAt,
        String emailDeliveryError
) {
}

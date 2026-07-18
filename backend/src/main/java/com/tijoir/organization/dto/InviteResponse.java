package com.tijoir.organization.dto;

import com.tijoir.notification.NotificationEmailDeliveryStatus;
import com.tijoir.organization.OrganizationInviteStatus;
import com.tijoir.organization.UserRole;

import java.time.Instant;
import java.util.UUID;

public record InviteResponse(
        UUID id,
        String email,
        UserRole role,
        OrganizationInviteStatus status,
        String invitedByName,
        Instant expiresAt,
        Instant acceptedAt,
        Instant createdAt,
        NotificationEmailDeliveryStatus emailDeliveryStatus,
        Instant emailDeliveredAt,
        String emailDeliveryError,
        String inviteToken,
        String acceptPath
) {
}

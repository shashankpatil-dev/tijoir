package com.tijoir.notification;

import java.time.Instant;

public record NotificationDeliverySnapshot(
        NotificationEmailDeliveryStatus status,
        Instant deliveredAt,
        String error
) {
    public static NotificationDeliverySnapshot notRequested() {
        return new NotificationDeliverySnapshot(NotificationEmailDeliveryStatus.NOT_REQUESTED, null, null);
    }
}

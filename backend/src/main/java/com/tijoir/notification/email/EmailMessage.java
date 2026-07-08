package com.tijoir.notification.email;

public record EmailMessage(
        String to,
        String subject,
        String textBody
) {
}

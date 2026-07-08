package com.tijoir.notification;

import com.tijoir.organization.OrganizationInvite;
import com.tijoir.organization.UserAccount;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class NotificationEventPublisher {
    private final ApplicationEventPublisher applicationEventPublisher;
    private final NotificationProperties notificationProperties;
    private final NotificationLinkFactory notificationLinkFactory;

    public NotificationEventPublisher(
            ApplicationEventPublisher applicationEventPublisher,
            NotificationProperties notificationProperties,
            NotificationLinkFactory notificationLinkFactory
    ) {
        this.applicationEventPublisher = applicationEventPublisher;
        this.notificationProperties = notificationProperties;
        this.notificationLinkFactory = notificationLinkFactory;
    }

    public void publishVerificationRequested(UserAccount user, String rawToken, Instant expiresAt, boolean resend) {
        applicationEventPublisher.publishEvent(new NotificationEvent(
                resend ? NotificationType.EMAIL_VERIFICATION_RESEND : NotificationType.EMAIL_VERIFICATION,
                user.getOrganization(),
                user,
                user.getEmail(),
                user.getName(),
                user.getOrganization().getName(),
                notificationLinkFactory.verificationLink(rawToken, user.getEmail()),
                expiresAt,
                notificationProperties.isEnabled()
                        && notificationProperties.getEmail().isEnabled()
                        && notificationProperties.getEmail().getVerification().isEnabled()
        ));
    }

    public void publishInviteCreated(UserAccount actor, OrganizationInvite invite, String rawToken) {
        applicationEventPublisher.publishEvent(new NotificationEvent(
                NotificationType.ORGANIZATION_INVITE,
                actor.getOrganization(),
                actor,
                invite.getEmail(),
                null,
                actor.getOrganization().getName(),
                notificationLinkFactory.inviteLink(rawToken),
                invite.getExpiresAt(),
                notificationProperties.isEnabled()
                        && notificationProperties.getEmail().isEnabled()
                        && notificationProperties.getEmail().getInvites().isEnabled()
        ));
    }
}

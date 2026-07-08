package com.tijoir.notification;

import com.tijoir.notification.email.EmailSender;
import com.tijoir.notification.email.EmailTemplateFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class NotificationWorkflow {
    private final NotificationProperties notificationProperties;
    private final NotificationRecordRepository notificationRecordRepository;
    private final EmailTemplateFactory emailTemplateFactory;
    private final EmailSender emailSender;

    public NotificationWorkflow(
            NotificationProperties notificationProperties,
            NotificationRecordRepository notificationRecordRepository,
            EmailTemplateFactory emailTemplateFactory,
            EmailSender emailSender
    ) {
        this.notificationProperties = notificationProperties;
        this.notificationRecordRepository = notificationRecordRepository;
        this.emailTemplateFactory = emailTemplateFactory;
        this.emailSender = emailSender;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handle(NotificationEvent event) {
        if (!notificationProperties.isEnabled()) {
            return;
        }

        NotificationRecord record = notificationRecordRepository.save(new NotificationRecord(
                event.organization(),
                event.user(),
                event.type(),
                titleFor(event),
                messageFor(event),
                event.actionUrl(),
                event.recipientEmail(),
                event.requestEmailDelivery()
                        ? NotificationEmailDeliveryStatus.NOT_REQUESTED
                        : NotificationEmailDeliveryStatus.SKIPPED
        ));

        if (!event.requestEmailDelivery()) {
            record.markSkipped();
            return;
        }

        EmailSender.DeliveryResult result = emailSender.send(emailTemplateFactory.build(event));
        if (result.delivered()) {
            record.markDelivered();
        } else if (result.skipped()) {
            record.markSkipped();
        } else {
            record.markFailed(result.error());
        }
    }

    private String titleFor(NotificationEvent event) {
        return switch (event.type()) {
            case EMAIL_VERIFICATION -> "Verification email prepared";
            case EMAIL_VERIFICATION_RESEND -> "Verification email resent";
            case ORGANIZATION_INVITE -> "Organization invite created";
        };
    }

    private String messageFor(NotificationEvent event) {
        return switch (event.type()) {
            case EMAIL_VERIFICATION ->
                    "A verification link was issued for %s.".formatted(event.recipientEmail());
            case EMAIL_VERIFICATION_RESEND ->
                    "A fresh verification link was issued for %s.".formatted(event.recipientEmail());
            case ORGANIZATION_INVITE ->
                    "An organization invite was issued for %s.".formatted(event.recipientEmail());
        };
    }
}

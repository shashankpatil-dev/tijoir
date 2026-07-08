package com.tijoir.notification.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class NoopEmailSender implements EmailSender {
    private static final Logger log = LoggerFactory.getLogger(NoopEmailSender.class);

    @Override
    public DeliveryResult send(EmailMessage message) {
        log.info("Noop email sender accepted message to={} subject={}", message.to(), message.subject());
        return DeliveryResult.skippedResult();
    }
}

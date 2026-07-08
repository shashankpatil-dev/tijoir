package com.tijoir.notification.email;

import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.Body;
import software.amazon.awssdk.services.ses.model.Content;
import software.amazon.awssdk.services.ses.model.Destination;
import software.amazon.awssdk.services.ses.model.Message;
import software.amazon.awssdk.services.ses.model.SendEmailRequest;

public class SesEmailSender implements EmailSender {
    private final SesClient sesClient;
    private final String fromAddress;

    public SesEmailSender(SesClient sesClient, String fromAddress) {
        this.sesClient = sesClient;
        this.fromAddress = fromAddress;
    }

    @Override
    public DeliveryResult send(EmailMessage message) {
        try {
            sesClient.sendEmail(SendEmailRequest.builder()
                    .source(fromAddress)
                    .destination(Destination.builder()
                            .toAddresses(message.to())
                            .build())
                    .message(Message.builder()
                            .subject(Content.builder().data(message.subject()).build())
                            .body(Body.builder()
                                    .text(Content.builder().data(message.textBody()).build())
                                    .build())
                            .build())
                    .build());
            return DeliveryResult.sent();
        } catch (Exception exception) {
            return DeliveryResult.failed(exception.getMessage());
        }
    }
}

package com.tijoir.notification.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tijoir.notification.NotificationProperties;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.net.http.HttpClient;

import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ses.SesClient;

@Configuration
public class EmailSenderConfig {
    @Bean
    public EmailSender emailSender(
            NotificationProperties notificationProperties,
            ObjectProvider<SesClient> sesClientProvider,
            ObjectProvider<ObjectMapper> objectMapperProvider
    ) {
        if (!notificationProperties.getEmail().isEnabled()) {
            return new NoopEmailSender();
        }

        SesClient sesClient = sesClientProvider.getIfAvailable();
        EmailSender sesSender = sesClient != null
                ? new SesEmailSender(sesClient, notificationProperties.getEmail().getFromAddress())
                : null;

        String provider = notificationProperties.getEmail().getProvider();
        if ("brevo".equalsIgnoreCase(provider)) {
            String apiKey = notificationProperties.getEmail().getBrevoApiKey();
            if (apiKey == null || apiKey.isBlank()) {
                return sesSender != null ? sesSender : new NoopEmailSender();
            }

            ObjectMapper objectMapper = objectMapperProvider.getIfAvailable(ObjectMapper::new);
            EmailSender brevoSender = new BrevoEmailSender(
                    HttpClient.newHttpClient(),
                    objectMapper,
                    apiKey,
                    notificationProperties.getEmail().getFromAddress(),
                    notificationProperties.getEmail().getFromName()
            );

            if (sesSender == null) {
                return brevoSender;
            }

            return message -> {
                EmailSender.DeliveryResult result = brevoSender.send(message);
                return result.delivered() ? result : sesSender.send(message);
            };
        }

        if ("ses".equalsIgnoreCase(provider)) {
            if (sesSender != null) {
                return sesSender;
            }
        }

        return new NoopEmailSender();
    }

    @Bean
    @Profile("prod")
    public SesClient sesClient(@org.springframework.beans.factory.annotation.Value("${tijoir.aws.region}") String awsRegion) {
        return SesClient.builder()
                .region(Region.of(awsRegion))
                .httpClientBuilder(UrlConnectionHttpClient.builder())
                .build();
    }
}

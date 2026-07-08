package com.tijoir.notification.email;

import com.tijoir.notification.NotificationProperties;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ses.SesClient;

@Configuration
public class EmailSenderConfig {
    @Bean
    public EmailSender emailSender(
            NotificationProperties notificationProperties,
            ObjectProvider<SesClient> sesClientProvider
    ) {
        if (!notificationProperties.getEmail().isEnabled()) {
            return new NoopEmailSender();
        }

        String provider = notificationProperties.getEmail().getProvider();
        if ("ses".equalsIgnoreCase(provider)) {
            SesClient sesClient = sesClientProvider.getIfAvailable();
            if (sesClient != null) {
                return new SesEmailSender(sesClient, notificationProperties.getEmail().getFromAddress());
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

package com.tijoir.notification.email;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

public class BrevoEmailSender implements EmailSender {
    private static final URI BREVO_SEND_EMAIL_URI = URI.create("https://api.brevo.com/v3/smtp/email");

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String fromAddress;
    private final String fromName;

    public BrevoEmailSender(
            HttpClient httpClient,
            ObjectMapper objectMapper,
            String apiKey,
            String fromAddress,
            String fromName
    ) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.fromAddress = fromAddress;
        this.fromName = fromName;
    }

    @Override
    public DeliveryResult send(EmailMessage message) {
        try {
            String payload = objectMapper.writeValueAsString(Map.of(
                    "sender", Map.of(
                            "email", fromAddress,
                            "name", fromName
                    ),
                    "to", List.of(Map.of("email", message.to())),
                    "subject", message.subject(),
                    "textContent", message.textBody()
            ));

            HttpRequest request = HttpRequest.newBuilder(BREVO_SEND_EMAIL_URI)
                    .timeout(Duration.ofSeconds(10))
                    .header("accept", "application/json")
                    .header("content-type", "application/json")
                    .header("api-key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return DeliveryResult.sent();
            }
            return DeliveryResult.failed("Brevo response %d: %s".formatted(
                    response.statusCode(),
                    abbreviate(response.body())
            ));
        } catch (Exception exception) {
            return DeliveryResult.failed(exception.getMessage());
        }
    }

    private String abbreviate(String body) {
        if (body == null || body.isBlank()) {
            return "empty response body";
        }
        if (body.length() <= 200) {
            return body;
        }
        return body.substring(0, 200);
    }
}

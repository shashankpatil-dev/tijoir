package com.tijoir.notification;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import com.tijoir.notification.email.BrevoEmailSender;
import com.tijoir.notification.email.EmailMessage;
import com.tijoir.notification.email.EmailSender;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BrevoEmailSenderTest {
    @Test
    void sendsBrevoPayloadWithConfiguredSender() throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();
        AtomicReference<String> seenApiKey = new AtomicReference<>();
        AtomicReference<String> seenBody = new AtomicReference<>();
        HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/v3/smtp/email", exchange -> handle(exchange, seenApiKey, seenBody));
        server.start();

        try {
            EmailSender sender = new BrevoEmailSender(
                    rewriteBrevoUriClient(server.getAddress().getPort()),
                    objectMapper,
                    "brevo-test-key",
                    "shashankpatil.dev@gmail.com",
                    "Tijoir"
            );

            EmailSender.DeliveryResult result = sender.send(new EmailMessage(
                    "member@example.com",
                    "Verify your Tijoir account",
                    "hello"
            ));

            assertTrue(result.delivered());
            assertEquals("brevo-test-key", seenApiKey.get());
            JsonNode json = objectMapper.readTree(seenBody.get());
            assertEquals("shashankpatil.dev@gmail.com", json.get("sender").get("email").asText());
            assertEquals("Tijoir", json.get("sender").get("name").asText());
            assertEquals("member@example.com", json.get("to").get(0).get("email").asText());
            assertEquals("Verify your Tijoir account", json.get("subject").asText());
            assertEquals("hello", json.get("textContent").asText());
        } finally {
            server.stop(0);
        }
    }

    private static HttpClient rewriteBrevoUriClient(int port) {
        return new HttpClient() {
            private final HttpClient delegate = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(5))
                    .build();

            @Override
            public <T> HttpResponse<T> send(HttpRequest request, HttpResponse.BodyHandler<T> responseBodyHandler)
                    throws IOException, InterruptedException {
                HttpRequest rewritten = HttpRequest.newBuilder(URI.create("http://127.0.0.1:%d/v3/smtp/email".formatted(port)))
                        .timeout(request.timeout().orElse(Duration.ofSeconds(10)))
                        .headers(request.headers().map().entrySet().stream()
                                .flatMap(entry -> entry.getValue().stream().flatMap(value -> java.util.stream.Stream.of(entry.getKey(), value)))
                                .toArray(String[]::new))
                        .method(request.method(), request.bodyPublisher().orElse(HttpRequest.BodyPublishers.noBody()))
                        .build();
                return delegate.send(rewritten, responseBodyHandler);
            }

            @Override
            public <T> java.util.concurrent.CompletableFuture<HttpResponse<T>> sendAsync(
                    HttpRequest request,
                    HttpResponse.BodyHandler<T> responseBodyHandler
            ) {
                throw new UnsupportedOperationException();
            }

            @Override
            public <T> java.util.concurrent.CompletableFuture<HttpResponse<T>> sendAsync(
                    HttpRequest request,
                    HttpResponse.BodyHandler<T> responseBodyHandler,
                    HttpResponse.PushPromiseHandler<T> pushPromiseHandler
            ) {
                throw new UnsupportedOperationException();
            }

            @Override
            public java.util.Optional<java.net.CookieHandler> cookieHandler() {
                return delegate.cookieHandler();
            }

            @Override
            public java.util.Optional<Duration> connectTimeout() {
                return delegate.connectTimeout();
            }

            @Override
            public Redirect followRedirects() {
                return delegate.followRedirects();
            }

            @Override
            public java.util.Optional<java.net.ProxySelector> proxy() {
                return delegate.proxy();
            }

            @Override
            public javax.net.ssl.SSLContext sslContext() {
                return delegate.sslContext();
            }

            @Override
            public javax.net.ssl.SSLParameters sslParameters() {
                return delegate.sslParameters();
            }

            @Override
            public java.util.Optional<java.net.Authenticator> authenticator() {
                return delegate.authenticator();
            }

            @Override
            public Version version() {
                return delegate.version();
            }

            @Override
            public java.util.Optional<java.util.concurrent.Executor> executor() {
                return delegate.executor();
            }
        };
    }

    private static void handle(HttpExchange exchange, AtomicReference<String> seenApiKey, AtomicReference<String> seenBody)
            throws IOException {
        seenApiKey.set(exchange.getRequestHeaders().getFirst("api-key"));
        seenBody.set(new String(exchange.getRequestBody().readAllBytes()));
        byte[] body = "{\"messageId\":\"ok\"}".getBytes();
        exchange.sendResponseHeaders(201, body.length);
        try (OutputStream outputStream = exchange.getResponseBody()) {
            outputStream.write(body);
        }
    }
}

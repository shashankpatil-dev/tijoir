package com.tijoir.auth.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tijoir.common.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.math.BigInteger;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.Signature;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Verifies a Google Identity Services (GIS) ID token server-side:
 * fetches Google's JWKS, verifies the RS256 signature, and validates aud / iss / exp.
 * No third-party dependency — mirrors the app's self-built JWT approach.
 */
@Component
public class GoogleTokenVerifier {
    private static final String CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
    private static final Set<String> ISSUERS =
            Set.of("accounts.google.com", "https://accounts.google.com");
    private static final Base64.Decoder URL_DECODER = Base64.getUrlDecoder();

    private final String clientId;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private volatile Map<String, RSAPublicKey> keyCache = Map.of();
    private volatile Instant keyCacheExpiry = Instant.EPOCH;

    public GoogleTokenVerifier(
            @Value("${tijoir.security.google-client-id:}") String clientId,
            ObjectMapper objectMapper
    ) {
        this.clientId = clientId;
        this.objectMapper = objectMapper;
    }

    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank();
    }

    public GoogleIdentity verify(String idToken) {
        if (!isConfigured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Google sign-in is not configured");
        }
        String[] parts = idToken == null ? new String[0] : idToken.split("\\.");
        if (parts.length != 3) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Google token");
        }
        try {
            JsonNode header = objectMapper.readTree(URL_DECODER.decode(parts[0]));
            if (!"RS256".equals(header.path("alg").asText())) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Unsupported Google token algorithm");
            }
            RSAPublicKey key = resolveKey(header.path("kid").asText());

            Signature signature = Signature.getInstance("SHA256withRSA");
            signature.initVerify(key);
            signature.update((parts[0] + "." + parts[1]).getBytes(StandardCharsets.US_ASCII));
            if (!signature.verify(URL_DECODER.decode(parts[2]))) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Google token signature");
            }

            JsonNode payload = objectMapper.readTree(URL_DECODER.decode(parts[1]));
            if (!clientId.equals(payload.path("aud").asText())) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Google token audience mismatch");
            }
            if (!ISSUERS.contains(payload.path("iss").asText())) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Google token issuer mismatch");
            }
            if (Instant.ofEpochSecond(payload.path("exp").asLong(0)).isBefore(Instant.now())) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Google token has expired");
            }
            String email = payload.path("email").asText(null);
            if (email == null || email.isBlank()) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Google token is missing an email");
            }
            return new GoogleIdentity(
                    payload.path("sub").asText(),
                    email,
                    payload.path("name").asText(email),
                    payload.path("email_verified").asBoolean(false)
            );
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Could not verify Google token");
        }
    }

    private RSAPublicKey resolveKey(String kid) throws Exception {
        RSAPublicKey key = keyCache.get(kid);
        if (key != null && keyCacheExpiry.isAfter(Instant.now())) {
            return key;
        }
        refreshKeys();
        key = keyCache.get(kid);
        if (key == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Unknown Google signing key");
        }
        return key;
    }

    private synchronized void refreshKeys() throws Exception {
        if (keyCacheExpiry.isAfter(Instant.now()) && !keyCache.isEmpty()) {
            return;
        }
        HttpResponse<String> response = httpClient.send(
                HttpRequest.newBuilder(URI.create(CERTS_URL)).GET().timeout(Duration.ofSeconds(5)).build(),
                HttpResponse.BodyHandlers.ofString()
        );
        JsonNode keys = objectMapper.readTree(response.body()).path("keys");
        Map<String, RSAPublicKey> parsed = new HashMap<>();
        KeyFactory factory = KeyFactory.getInstance("RSA");
        for (JsonNode jwk : keys) {
            BigInteger modulus = new BigInteger(1, URL_DECODER.decode(jwk.path("n").asText()));
            BigInteger exponent = new BigInteger(1, URL_DECODER.decode(jwk.path("e").asText()));
            RSAPublicKey key = (RSAPublicKey) factory.generatePublic(new RSAPublicKeySpec(modulus, exponent));
            parsed.put(jwk.path("kid").asText(), key);
        }
        keyCache = Map.copyOf(parsed);
        keyCacheExpiry = Instant.now().plus(Duration.ofHours(1));
    }

    public record GoogleIdentity(String sub, String email, String name, boolean emailVerified) {
    }
}

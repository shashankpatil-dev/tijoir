package com.tijoir.auth.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tijoir.common.exception.ApiException;
import com.tijoir.identity.IdentityUser;
import com.tijoir.organization.UserAccount;
import com.tijoir.organization.UserRole;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class JwtService {
    private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder URL_DECODER = Base64.getUrlDecoder();
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;
    private final byte[] secretBytes;
    private final Duration expiration;

    public JwtService(
            ObjectMapper objectMapper,
            @Value("${tijoir.security.jwt-secret}") String jwtSecret,
            @Value("${tijoir.security.jwt-expiration-minutes}") long expirationMinutes
    ) {
        this.objectMapper = objectMapper;
        this.secretBytes = jwtSecret == null ? new byte[0] : jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (this.secretBytes.length < 32) {
            throw new IllegalStateException(
                    "tijoir.security.jwt-secret must be set to at least 32 bytes (256 bits). "
                            + "Provide a strong JWT_SECRET via environment; no usable default is shipped.");
        }
        this.expiration = Duration.ofMinutes(expirationMinutes);
    }

    public TokenResult issueToken(IdentityUser identityUser, UserAccount user) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(expiration);

        Map<String, Object> header = new LinkedHashMap<>();
        header.put("alg", "HS256");
        header.put("typ", "JWT");

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("identity_user_id", identityUser.getId().toString());
        payload.put("sub", user.getId().toString());
        payload.put("org_id", user.getOrganization().getId().toString());
        payload.put("email", user.getEmail());
        payload.put("role", user.getRole().name());
        payload.put("iat", issuedAt.getEpochSecond());
        payload.put("exp", expiresAt.getEpochSecond());

        String unsignedToken = base64Json(header) + "." + base64Json(payload);
        String signature = URL_ENCODER.encodeToString(hmacSha256(unsignedToken));
        return new TokenResult(unsignedToken + "." + signature, expiresAt);
    }

    public JwtClaims parse(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid token");
        }

        String expectedSignature = URL_ENCODER.encodeToString(hmacSha256(parts[0] + "." + parts[1]));
        if (!MessageDigestSupport.constantTimeEquals(expectedSignature, parts[2])) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid token signature");
        }

        try {
            Map<String, Object> payload = objectMapper.readValue(URL_DECODER.decode(parts[1]), MAP_TYPE);
            Instant issuedAt = Instant.ofEpochSecond(((Number) payload.get("iat")).longValue());
            Instant expiresAt = Instant.ofEpochSecond(((Number) payload.get("exp")).longValue());
            if (expiresAt.isBefore(Instant.now())) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Token expired");
            }

            return new JwtClaims(
                    UUID.fromString((String) payload.get("identity_user_id")),
                    UUID.fromString((String) payload.get("sub")),
                    UUID.fromString((String) payload.get("org_id")),
                    (String) payload.get("email"),
                    UserRole.valueOf((String) payload.get("role")),
                    issuedAt,
                    expiresAt
            );
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid token");
        }
    }

    private String base64Json(Map<String, Object> value) {
        try {
            return URL_ENCODER.encodeToString(objectMapper.writeValueAsBytes(value));
        } catch (Exception ex) {
            throw new IllegalStateException("Could not serialize JWT value", ex);
        }
    }

    private byte[] hmacSha256(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretBytes, "HmacSHA256"));
            return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ex) {
            throw new IllegalStateException("Could not sign JWT", ex);
        }
    }

    public record TokenResult(String token, Instant expiresAt) {
    }

    private static final class MessageDigestSupport {
        private MessageDigestSupport() {
        }

        static boolean constantTimeEquals(String left, String right) {
            byte[] leftBytes = left.getBytes(StandardCharsets.UTF_8);
            byte[] rightBytes = right.getBytes(StandardCharsets.UTF_8);
            if (leftBytes.length != rightBytes.length) {
                return false;
            }
            int result = 0;
            for (int i = 0; i < leftBytes.length; i++) {
                result |= leftBytes[i] ^ rightBytes[i];
            }
            return result == 0;
        }
    }
}

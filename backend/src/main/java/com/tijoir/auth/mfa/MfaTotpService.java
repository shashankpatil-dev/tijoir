package com.tijoir.auth.mfa;

import com.tijoir.common.exception.ApiException;
import com.tijoir.common.util.CryptoUtil;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;

@Service
public class MfaTotpService {
    private static final String BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int SECRET_BYTES = 20;
    private static final int PERIOD_SECONDS = 30;
    private static final int DIGITS = 6;

    public String generateSecret() {
        return encodeBase32(CryptoUtil.randomBytes(SECRET_BYTES));
    }

    public boolean verify(String secret, String code, Instant now) {
        String normalized = normalizeCode(code);
        long step = now.getEpochSecond() / PERIOD_SECONDS;
        for (long candidate = step - 1; candidate <= step + 1; candidate++) {
            if (constantEquals(generateCode(secret, candidate), normalized)) {
                return true;
            }
        }
        return false;
    }

    public String currentCode(String secret, Instant now) {
        return generateCode(secret, now.getEpochSecond() / PERIOD_SECONDS);
    }

    public String otpauthUri(String issuer, String accountName, String secret) {
        String label = urlEncode(issuer + ":" + accountName);
        return "otpauth://totp/%s?secret=%s&issuer=%s&algorithm=SHA1&digits=%d&period=%d".formatted(
                label,
                secret,
                urlEncode(issuer),
                DIGITS,
                PERIOD_SECONDS
        );
    }

    private String normalizeCode(String code) {
        if (code == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MFA code is required");
        }
        String normalized = code.replaceAll("\\s+", "");
        if (!normalized.matches("\\d{6}")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MFA code must be a 6-digit value");
        }
        return normalized;
    }

    private String generateCode(String secret, long counter) {
        try {
            byte[] secretBytes = decodeBase32(secret);
            ByteBuffer buffer = ByteBuffer.allocate(8);
            buffer.putLong(counter);
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(secretBytes, "HmacSHA1"));
            byte[] digest = mac.doFinal(buffer.array());
            int offset = digest[digest.length - 1] & 0x0f;
            int binary = ((digest[offset] & 0x7f) << 24)
                    | ((digest[offset + 1] & 0xff) << 16)
                    | ((digest[offset + 2] & 0xff) << 8)
                    | (digest[offset + 3] & 0xff);
            int otp = binary % 1_000_000;
            return String.format(Locale.ROOT, "%06d", otp);
        } catch (ApiException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Could not generate TOTP code", exception);
        }
    }

    private byte[] decodeBase32(String encoded) {
        String normalized = encoded == null ? "" : encoded.trim().replace("=", "").replaceAll("\\s+", "").toUpperCase(Locale.ROOT);
        if (normalized.isBlank() || !normalized.matches("[A-Z2-7]+")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid MFA shared secret");
        }
        int buffer = 0;
        int bitsLeft = 0;
        ByteBuffer output = ByteBuffer.allocate((normalized.length() * 5 + 7) / 8);
        for (char character : normalized.toCharArray()) {
            int value = BASE32_ALPHABET.indexOf(character);
            if (value < 0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid MFA shared secret");
            }
            buffer = (buffer << 5) | value;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                output.put((byte) ((buffer >> (bitsLeft - 8)) & 0xff));
                bitsLeft -= 8;
            }
        }
        byte[] bytes = new byte[output.position()];
        output.flip();
        output.get(bytes);
        return bytes;
    }

    private String encodeBase32(byte[] bytes) {
        StringBuilder builder = new StringBuilder((bytes.length * 8 + 4) / 5);
        int buffer = 0;
        int bitsLeft = 0;
        for (byte current : bytes) {
            buffer = (buffer << 8) | (current & 0xff);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                builder.append(BASE32_ALPHABET.charAt((buffer >> (bitsLeft - 5)) & 0x1f));
                bitsLeft -= 5;
            }
        }
        if (bitsLeft > 0) {
            builder.append(BASE32_ALPHABET.charAt((buffer << (5 - bitsLeft)) & 0x1f));
        }
        return builder.toString();
    }

    private boolean constantEquals(String left, String right) {
        if (left.length() != right.length()) {
            return false;
        }
        int diff = 0;
        for (int index = 0; index < left.length(); index++) {
            diff |= left.charAt(index) ^ right.charAt(index);
        }
        return diff == 0;
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}

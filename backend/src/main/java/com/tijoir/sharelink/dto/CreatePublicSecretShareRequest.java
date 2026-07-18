package com.tijoir.sharelink.dto;

import com.tijoir.secret.SecretType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record CreatePublicSecretShareRequest(
        @NotBlank @Size(max = 255) String secretName,
        @NotBlank @Size(max = 255) String secretKey,
        @NotNull SecretType secretType,
        @NotBlank @Size(max = 32768) String value,
        @Size(max = 255) String senderLabel,
        @Size(max = 255) String recipientLabel,
        Instant expiresAt
) {
}

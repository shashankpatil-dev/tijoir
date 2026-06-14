package com.tijoir.secret.dto;

import com.tijoir.secret.SecretType;

import java.util.UUID;

public record RevealSecretResponse(
        UUID id,
        String secretKey,
        SecretType type,
        int versionNumber,
        String value
) {
}

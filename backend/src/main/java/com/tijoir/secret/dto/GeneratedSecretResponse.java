package com.tijoir.secret.dto;

import com.tijoir.secret.SecretType;

public record GeneratedSecretResponse(
        SecretType type,
        int length,
        String value
) {
}

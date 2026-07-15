package com.tijoir.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        // Optional: not required for Google-only users setting a password for the first time.
        String currentPassword,
        @NotBlank @Size(min = 10, max = 100) String newPassword
) {
}

package com.tijoir.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(max = 255) String organizationName,
        @NotBlank @Email @Size(max = 255) String organizationEmail,
        @NotBlank @Size(max = 255) String userName,
        @NotBlank @Email @Size(max = 255) String userEmail,
        @NotBlank @Size(min = 10, max = 100) String password
) {
}


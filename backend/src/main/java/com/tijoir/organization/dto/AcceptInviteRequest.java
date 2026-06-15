package com.tijoir.organization.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AcceptInviteRequest(
        @NotBlank String token,
        @NotBlank String name,
        @NotBlank @Size(min = 10, max = 128) String password
) {
}

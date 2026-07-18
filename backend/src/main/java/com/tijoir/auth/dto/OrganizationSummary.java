package com.tijoir.auth.dto;

import java.util.UUID;

public record OrganizationSummary(
        UUID id,
        String name,
        String slug,
        String email
) {
}

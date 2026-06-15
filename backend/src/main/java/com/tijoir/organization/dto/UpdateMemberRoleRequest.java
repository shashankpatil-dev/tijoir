package com.tijoir.organization.dto;

import com.tijoir.organization.UserRole;
import jakarta.validation.constraints.NotNull;

public record UpdateMemberRoleRequest(
        @NotNull UserRole role
) {
}

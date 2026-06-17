package com.tijoir.organization.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateOrganizationPolicyRequest(
        @Min(1) @Max(8760) Integer defaultShareLinkExpiryHours,
        @NotNull Boolean requireVendorContractForShareLinks,
        @NotNull Boolean allowViewOnce,
        @NotNull Boolean allowViewUntilRevoked,
        @NotNull Boolean allowRotationNotifyOnly,
        @Min(1) @Max(365) Integer rotationReminderDays
) {
}

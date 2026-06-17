package com.tijoir.organization.dto;

import java.time.Instant;

public record OrganizationPolicyResponse(
        Integer defaultShareLinkExpiryHours,
        boolean requireVendorContractForShareLinks,
        boolean allowViewOnce,
        boolean allowViewUntilRevoked,
        boolean allowRotationNotifyOnly,
        Integer rotationReminderDays,
        Instant updatedAt
) {
}

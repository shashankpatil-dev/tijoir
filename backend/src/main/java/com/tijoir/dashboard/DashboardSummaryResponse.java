package com.tijoir.dashboard;

import com.tijoir.secret.dto.SecretSummaryResponse;

public record DashboardSummaryResponse(
        long secretCount,
        long activeShareLinks,
        long vendorCount,
        long memberCount,
        long pendingInvites,
        SecretSummaryResponse latestSecret
) {
}

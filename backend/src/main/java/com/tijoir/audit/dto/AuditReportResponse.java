package com.tijoir.audit.dto;

import java.util.Map;

public record AuditReportResponse(
        long totalEvents,
        long eventsInLast24Hours,
        Map<String, Long> byAction,
        Map<String, Long> byResourceType
) {
}

package com.tijoir.audit.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.tijoir.audit.AuditAction;

import java.time.Instant;
import java.util.UUID;

public record AuditEventResponse(
        UUID id,
        AuditAction action,
        String resourceType,
        UUID resourceId,
        UUID actorUserId,
        String actorName,
        String actorEmail,
        JsonNode details,
        Instant createdAt
) {
}

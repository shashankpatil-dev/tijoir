package com.tijoir.connection.dto;

import com.tijoir.connection.VendorStatus;

import java.time.Instant;
import java.util.UUID;

public record VendorResponse(
        UUID id,
        String name,
        String contactName,
        String contactEmail,
        String notes,
        VendorStatus status,
        String createdByName,
        Instant offboardedAt,
        Instant createdAt
) {
}

package com.tijoir.securitycontrol;

public record StoredIdempotencyRecord(
        String requestHash,
        int statusCode,
        String bodyJson
) {
}

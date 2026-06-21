package com.tijoir.auth.mfa;

import java.time.Instant;
import java.util.UUID;

public record StoredMfaChallenge(
        UUID userId,
        UUID organizationId,
        MfaChallengePurpose purpose,
        String secretCiphertext,
        int failedAttempts,
        int maxAttempts,
        Instant createdAt
) {
    public StoredMfaChallenge incrementAttempts() {
        return new StoredMfaChallenge(
                userId,
                organizationId,
                purpose,
                secretCiphertext,
                failedAttempts + 1,
                maxAttempts,
                createdAt
        );
    }

    public boolean exhausted() {
        return failedAttempts >= maxAttempts;
    }
}

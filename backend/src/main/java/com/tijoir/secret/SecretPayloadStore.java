package com.tijoir.secret;

public interface SecretPayloadStore {
    StoredPayload store(VaultSecret secret, int versionNumber, String rawValue);

    String reveal(SecretVersion secretVersion);

    record StoredPayload(
            StoredPayloadBackend backend,
            String payloadRef,
            String payloadCiphertext
    ) {
    }
}

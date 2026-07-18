package com.tijoir.sharelink;

import com.tijoir.secret.SecretPayloadStore;

public interface PublicSecretPayloadStore {
    SecretPayloadStore.StoredPayload store(PublicSecretDrop drop, String rawValue);

    String reveal(PublicSecretDrop drop);
}

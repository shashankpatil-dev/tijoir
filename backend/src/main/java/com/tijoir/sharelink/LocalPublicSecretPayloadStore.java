package com.tijoir.sharelink;

import com.tijoir.common.util.LocalSecretCrypto;
import com.tijoir.secret.SecretPayloadStore;
import com.tijoir.secret.StoredPayloadBackend;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("!prod")
public class LocalPublicSecretPayloadStore implements PublicSecretPayloadStore {
    private final LocalSecretCrypto localSecretCrypto;

    public LocalPublicSecretPayloadStore(LocalSecretCrypto localSecretCrypto) {
        this.localSecretCrypto = localSecretCrypto;
    }

    @Override
    public SecretPayloadStore.StoredPayload store(PublicSecretDrop drop, String rawValue) {
        return new SecretPayloadStore.StoredPayload(
                StoredPayloadBackend.LOCAL_DATABASE,
                null,
                localSecretCrypto.encrypt(rawValue)
        );
    }

    @Override
    public String reveal(PublicSecretDrop drop) {
        return localSecretCrypto.decrypt(drop.getPayloadCiphertext());
    }
}

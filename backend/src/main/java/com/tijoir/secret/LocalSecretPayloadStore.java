package com.tijoir.secret;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import com.tijoir.common.util.LocalSecretCrypto;

@Component
@Profile("!prod")
public class LocalSecretPayloadStore implements SecretPayloadStore {
    private final LocalSecretCrypto localSecretCrypto;

    public LocalSecretPayloadStore(LocalSecretCrypto localSecretCrypto) {
        this.localSecretCrypto = localSecretCrypto;
    }

    @Override
    public StoredPayload store(VaultSecret secret, int versionNumber, String rawValue) {
        return new StoredPayload(StoredPayloadBackend.LOCAL_DATABASE, null, localSecretCrypto.encrypt(rawValue));
    }

    @Override
    public String reveal(SecretVersion secretVersion) {
        return localSecretCrypto.decrypt(secretVersion.getPayloadCiphertext());
    }
}

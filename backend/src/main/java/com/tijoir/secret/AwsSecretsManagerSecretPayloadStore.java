package com.tijoir.secret;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.CreateSecretRequest;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;

@Component
@Profile("prod")
public class AwsSecretsManagerSecretPayloadStore implements SecretPayloadStore {
    private final SecretsManagerClient secretsManagerClient;
    private final String appSecretNamePrefix;
    private final String kmsKeyId;

    public AwsSecretsManagerSecretPayloadStore(
            SecretsManagerClient secretsManagerClient,
            @Value("${tijoir.aws.app-secret-name-prefix}") String appSecretNamePrefix,
            @Value("${tijoir.aws.kms-key-id:}") String kmsKeyId
    ) {
        this.secretsManagerClient = secretsManagerClient;
        this.appSecretNamePrefix = appSecretNamePrefix;
        this.kmsKeyId = kmsKeyId;
    }

    @Override
    public StoredPayload store(VaultSecret secret, int versionNumber, String rawValue) {
        String secretName = "%ssecret/%s/v%d".formatted(appSecretNamePrefix, secret.getId(), versionNumber);
        CreateSecretRequest.Builder request = CreateSecretRequest.builder()
                .name(secretName)
                .secretString(rawValue)
                .description("Tijoir vault secret %s version %d".formatted(secret.getSecretKey(), versionNumber));
        if (!kmsKeyId.isBlank()) {
            request.kmsKeyId(kmsKeyId);
        }
        String arn = secretsManagerClient.createSecret(request.build()).arn();
        return new StoredPayload(StoredPayloadBackend.AWS_SECRETS_MANAGER, arn, null);
    }

    @Override
    public String reveal(SecretVersion secretVersion) {
        return secretsManagerClient.getSecretValue(GetSecretValueRequest.builder()
                        .secretId(secretVersion.getPayloadRef())
                        .build())
                .secretString();
    }
}

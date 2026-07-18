package com.tijoir.sharelink;

import com.tijoir.secret.SecretPayloadStore;
import com.tijoir.secret.StoredPayloadBackend;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.CreateSecretRequest;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;

@Component
@Profile("prod")
public class AwsPublicSecretPayloadStore implements PublicSecretPayloadStore {
    private final SecretsManagerClient secretsManagerClient;
    private final String appSecretNamePrefix;
    private final String kmsKeyId;

    public AwsPublicSecretPayloadStore(
            SecretsManagerClient secretsManagerClient,
            @Value("${tijoir.aws.app-secret-name-prefix}") String appSecretNamePrefix,
            @Value("${tijoir.aws.kms-key-id:}") String kmsKeyId
    ) {
        this.secretsManagerClient = secretsManagerClient;
        this.appSecretNamePrefix = appSecretNamePrefix;
        this.kmsKeyId = kmsKeyId;
    }

    @Override
    public SecretPayloadStore.StoredPayload store(PublicSecretDrop drop, String rawValue) {
        String secretName = "%spublic-share/%s".formatted(appSecretNamePrefix, drop.getId());
        CreateSecretRequest.Builder request = CreateSecretRequest.builder()
                .name(secretName)
                .secretString(rawValue)
                .description("Tijoir public one-time share %s".formatted(drop.getSecretKey()));
        if (!kmsKeyId.isBlank()) {
            request.kmsKeyId(kmsKeyId);
        }
        String arn = secretsManagerClient.createSecret(request.build()).arn();
        return new SecretPayloadStore.StoredPayload(StoredPayloadBackend.AWS_SECRETS_MANAGER, arn, null);
    }

    @Override
    public String reveal(PublicSecretDrop drop) {
        return secretsManagerClient.getSecretValue(GetSecretValueRequest.builder()
                        .secretId(drop.getPayloadRef())
                        .build())
                .secretString();
    }
}

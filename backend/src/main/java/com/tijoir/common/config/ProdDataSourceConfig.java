package com.tijoir.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;

import javax.sql.DataSource;

@Configuration
@Profile("prod")
public class ProdDataSourceConfig {
    @Bean
    public SecretsManagerClient secretsManagerClient(@Value("${tijoir.aws.region}") String awsRegion) {
        return SecretsManagerClient.builder()
                .region(Region.of(awsRegion))
                .httpClientBuilder(UrlConnectionHttpClient.builder())
                .build();
    }

    @Bean
    public DataSource dataSource(
            SecretsManagerClient secretsManagerClient,
            ObjectMapper objectMapper,
            DataSourceProperties properties,
            @Value("${tijoir.aws.database-secret-arn}") String databaseSecretArn
    ) throws Exception {
        String secretJson = secretsManagerClient.getSecretValue(GetSecretValueRequest.builder()
                        .secretId(databaseSecretArn)
                        .build())
                .secretString();
        DatabaseSecret secret = objectMapper.readValue(secretJson, DatabaseSecret.class);

        HikariDataSource dataSource = properties.initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
        dataSource.setJdbcUrl("jdbc:postgresql://%s:%s/%s".formatted(secret.host(), secret.port(), secret.dbname()));
        dataSource.setUsername(secret.username());
        dataSource.setPassword(secret.password());
        return dataSource;
    }

    private record DatabaseSecret(
            String username,
            String password,
            String engine,
            String host,
            int port,
            String dbname
    ) {
    }
}

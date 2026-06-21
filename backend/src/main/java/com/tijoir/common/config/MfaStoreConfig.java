package com.tijoir.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tijoir.auth.mfa.InMemoryMfaChallengeStore;
import com.tijoir.auth.mfa.MfaChallengeStore;
import com.tijoir.auth.mfa.RedisMfaChallengeStore;
import com.tijoir.securitycontrol.RedisSecurityProperties;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.env.Environment;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.Arrays;

@Configuration
public class MfaStoreConfig {
    @Bean
    public MfaChallengeStore mfaChallengeStore(
            RedisSecurityProperties redisSecurityProperties,
            ObjectProvider<StringRedisTemplate> stringRedisTemplateProvider,
            ObjectMapper objectMapper,
            Environment environment
    ) {
        StringRedisTemplate stringRedisTemplate = stringRedisTemplateProvider.getIfAvailable();
        boolean prodProfileActive = Arrays.asList(environment.getActiveProfiles()).contains("prod");
        boolean useRedis = prodProfileActive
                && redisSecurityProperties.isEnabled()
                && redisSecurityProperties.getMfa().isEnabled()
                && stringRedisTemplate != null;

        if (useRedis) {
            return new RedisMfaChallengeStore(stringRedisTemplate, objectMapper);
        }
        return new InMemoryMfaChallengeStore();
    }
}

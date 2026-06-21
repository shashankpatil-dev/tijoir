package com.tijoir.securitycontrol;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(RedisSecurityProperties.class)
public class SecurityControlConfig {
}

package com.tijoir.securitycontrol;

import com.tijoir.common.exception.ApiException;
import org.springframework.http.HttpStatus;

public class RateLimitException extends ApiException {
    private final long retryAfterSeconds;

    public RateLimitException(String message, long retryAfterSeconds) {
        super(HttpStatus.TOO_MANY_REQUESTS, message);
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}

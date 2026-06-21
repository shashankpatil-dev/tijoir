package com.tijoir.securitycontrol;

import org.springframework.http.HttpStatus;

public record IdempotentResponse<T>(
        HttpStatus status,
        T body,
        boolean replayed
) {
    public static <T> IdempotentResponse<T> ok(T body) {
        return new IdempotentResponse<>(HttpStatus.OK, body, false);
    }

    public static <T> IdempotentResponse<T> created(T body) {
        return new IdempotentResponse<>(HttpStatus.CREATED, body, false);
    }
}

package com.tijoir.sharelink;

import com.tijoir.common.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class InMemoryShareLinkConsumeGuard implements ShareLinkConsumeGuard {
    private final Set<String> activeLocks = ConcurrentHashMap.newKeySet();

    @Override
    public GuardLease acquire(String tokenHash) {
        boolean acquired = activeLocks.add(tokenHash);
        if (!acquired) {
            throw new ApiException(HttpStatus.CONFLICT, "Share link consumption is already in progress");
        }
        return () -> activeLocks.remove(tokenHash);
    }
}

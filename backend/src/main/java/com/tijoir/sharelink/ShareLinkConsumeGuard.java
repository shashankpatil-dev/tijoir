package com.tijoir.sharelink;

public interface ShareLinkConsumeGuard {
    GuardLease acquire(String tokenHash);

    interface GuardLease extends AutoCloseable {
        @Override
        void close();
    }
}

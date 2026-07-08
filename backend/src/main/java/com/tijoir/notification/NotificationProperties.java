package com.tijoir.notification;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "tijoir.notifications")
public class NotificationProperties {
    private boolean enabled = true;
    private boolean exposeDevTokens = true;
    private final Email email = new Email();

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isExposeDevTokens() {
        return exposeDevTokens;
    }

    public void setExposeDevTokens(boolean exposeDevTokens) {
        this.exposeDevTokens = exposeDevTokens;
    }

    public Email getEmail() {
        return email;
    }

    public static class Email {
        private boolean enabled = true;
        private String provider = "noop";
        private String fromAddress = "no-reply@localhost";
        private final Feature verification = new Feature(true);
        private final Feature invites = new Feature(true);

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public String getProvider() {
            return provider;
        }

        public void setProvider(String provider) {
            this.provider = provider;
        }

        public String getFromAddress() {
            return fromAddress;
        }

        public void setFromAddress(String fromAddress) {
            this.fromAddress = fromAddress;
        }

        public Feature getVerification() {
            return verification;
        }

        public Feature getInvites() {
            return invites;
        }
    }

    public static class Feature {
        private boolean enabled;

        public Feature() {
        }

        public Feature(boolean enabled) {
            this.enabled = enabled;
        }

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }
    }
}

package com.tijoir.notification.email;

public interface EmailSender {
    DeliveryResult send(EmailMessage message);

    record DeliveryResult(boolean delivered, boolean skipped, String error) {
        public static DeliveryResult sent() {
            return new DeliveryResult(true, false, null);
        }

        public static DeliveryResult skippedResult() {
            return new DeliveryResult(false, true, null);
        }

        public static DeliveryResult failed(String error) {
            return new DeliveryResult(false, false, error);
        }
    }
}

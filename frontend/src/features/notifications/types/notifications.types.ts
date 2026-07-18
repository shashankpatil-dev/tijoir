export type NotificationDeliveryStatus =
  | "NOT_REQUESTED"
  | "SKIPPED"
  | "SENT"
  | "FAILED";

export type NotificationType =
  | "EMAIL_VERIFICATION"
  | "EMAIL_VERIFICATION_RESEND"
  | "ORGANIZATION_INVITE"
  | "VENDOR_CONTRACT_PROPOSED"
  | "VENDOR_CONTRACT_ACCEPTED"
  | "VENDOR_CONTRACT_REJECTED";

export type NotificationSummary = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
  recipientEmail: string;
  emailDeliveryStatus: NotificationDeliveryStatus;
  readAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
};

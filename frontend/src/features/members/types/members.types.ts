export type InviteStatus = "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";

export type MemberSummary = {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
};

export type InviteSummary = {
  id: string;
  email: string;
  role: string;
  status: InviteStatus;
  invitedByName: string;
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
  emailDeliveryStatus?: string | null;
  emailDeliveredAt?: string | null;
  emailDeliveryError?: string | null;
  inviteToken?: string | null;
  acceptPath?: string | null;
};

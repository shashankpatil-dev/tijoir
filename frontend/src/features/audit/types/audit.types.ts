export type AuditAction =
  | "SECRET_CREATED"
  | "SECRET_REVEALED"
  | "SECRET_REVOKED"
  | "SECRET_ROTATED"
  | "SHARE_LINK_CREATED"
  | "SHARE_LINK_CONSUMED"
  | "SHARE_LINK_REVOKED"
  | "VENDOR_CREATED"
  | "VENDOR_CONTRACT_CREATED"
  | "VENDOR_CONTRACT_ACCEPTED"
  | "VENDOR_CONTRACT_REJECTED"
  | "VENDOR_CONTRACT_REVOKED"
  | "VENDOR_CONTRACT_GRANT_CREATED"
  | "VENDOR_CONTRACT_GRANT_REVEALED"
  | "VENDOR_CONTRACT_GRANT_REVOKED"
  | "VENDOR_OFFBOARDED"
  | "MEMBER_INVITED"
  | "MEMBER_INVITE_ACCEPTED"
  | "MEMBER_INVITE_REVOKED"
  | "MEMBER_ROLE_UPDATED"
  | "MEMBER_REMOVED"
  | "ORGANIZATION_POLICY_UPDATED";

export type AuditEventResponse = {
  id: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  actorUserId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  details?: Record<string, unknown> | string | null;
  createdAt: string;
};

export type AuditReportResponse = {
  totalEvents: number;
  eventsInLast24Hours: number;
  byAction: Record<string, number>;
  byResourceType: Record<string, number>;
};

export const AUDIT_ACTIONS: AuditAction[] = [
  "SECRET_CREATED",
  "SECRET_REVEALED",
  "SECRET_REVOKED",
  "SECRET_ROTATED",
  "SHARE_LINK_CREATED",
  "SHARE_LINK_CONSUMED",
  "SHARE_LINK_REVOKED",
  "VENDOR_CREATED",
  "VENDOR_CONTRACT_CREATED",
  "VENDOR_CONTRACT_ACCEPTED",
  "VENDOR_CONTRACT_REJECTED",
  "VENDOR_CONTRACT_REVOKED",
  "VENDOR_CONTRACT_GRANT_CREATED",
  "VENDOR_CONTRACT_GRANT_REVEALED",
  "VENDOR_CONTRACT_GRANT_REVOKED",
  "VENDOR_OFFBOARDED",
  "MEMBER_INVITED",
  "MEMBER_INVITE_ACCEPTED",
  "MEMBER_INVITE_REVOKED",
  "MEMBER_ROLE_UPDATED",
  "MEMBER_REMOVED",
  "ORGANIZATION_POLICY_UPDATED",
];

import type { MemberSummary } from "@/features/members/types/members.types";

export function canEditMember(
  actorRole: string,
  member: MemberSummary,
  actorEmail: string,
) {
  if (member.email === actorEmail) {
    return false;
  }
  if (member.role === "ORG_OWNER") {
    return false;
  }
  if (actorRole === "ORG_OWNER") {
    return true;
  }
  return actorRole === "ADMIN" && member.role !== "ADMIN";
}

export function canRemoveMember(
  actorRole: string,
  member: MemberSummary,
  actorEmail: string,
) {
  if (member.email === actorEmail) {
    return false;
  }
  if (member.role === "ORG_OWNER") {
    return false;
  }
  if (actorRole === "ORG_OWNER") {
    return true;
  }
  return actorRole === "ADMIN" && member.role !== "ADMIN";
}

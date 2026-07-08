import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buildStaticAppUrl } from "@/lib/auth-client";
import type { InvitePreview, RouterLike, ShowToast } from "@/features/dashboard/hooks/workspace.types";
import {
  createInvite,
  removeMember,
  revokeInvite,
  updateMemberRole,
} from "@/features/members/api/members.api";
import {
  invalidateInvitesQueries,
  invalidateMembersQueries,
} from "@/features/members/hooks/member-query-utils";
import type { MemberSummary } from "@/features/members/types/members.types";

type MembersFormStateLike = {
  inviteEmail: string;
  inviteRole: string;
  memberRoleValue: string;
  selectedMember: MemberSummary | null;
  setCreateInviteOpen: (value: boolean) => void;
  setInviteEmail: (value: string) => void;
  setInviteRole: (value: string) => void;
  setMemberRoleDialogOpen: (value: boolean) => void;
};

export function useMemberActions({
  assignableRoles,
  formState,
  handleSessionError,
  invitePage,
  inviteSearch,
  inviteStatusFilter,
  memberPage,
  memberRoleFilter,
  memberSearch,
  onInviteCreated,
  router,
  sessionAccessToken,
  setActionBusy,
  setMessage,
  showToast,
}: {
  assignableRoles: string[];
  formState: MembersFormStateLike;
  handleSessionError: (error: unknown, fallback: string) => void;
  invitePage: number;
  inviteSearch: string;
  inviteStatusFilter: string;
  memberPage: number;
  memberRoleFilter: string;
  memberSearch: string;
  onInviteCreated: (preview: InvitePreview | null) => void;
  router: RouterLike;
  sessionAccessToken?: string;
  setActionBusy: (value: string | null) => void;
  setMessage: (value: string) => void;
  showToast: ShowToast;
}) {
  const queryClient = useQueryClient();

  const createInviteMutation = useMutation({
    mutationFn: (payload: { email: string; role: string }) =>
      createInvite(sessionAccessToken as string, payload),
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: (payload: { memberId: string; role: string }) =>
      updateMemberRole(sessionAccessToken as string, payload.memberId, payload.role),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => removeMember(sessionAccessToken as string, memberId),
  });

  const revokeInviteMutation = useMutation({
    mutationFn: (inviteId: string) => revokeInvite(sessionAccessToken as string, inviteId),
  });

  async function handleCreateInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionAccessToken) {
      router.replace("/login");
      return;
    }

    setActionBusy("create-invite");
    setMessage("Creating organization invite");

    try {
      const created = await createInviteMutation.mutateAsync({
        email: formState.inviteEmail,
        role: formState.inviteRole,
      });

      const preview =
        created.inviteToken && created.acceptPath
          ? {
              token: created.inviteToken,
              appUrl: buildStaticAppUrl(created.acceptPath, {
                token: created.inviteToken,
              }),
            }
          : null;

      formState.setInviteEmail("");
      formState.setInviteRole(assignableRoles[0] || "MEMBER");
      formState.setCreateInviteOpen(false);
      router.push("/dashboard/organization");
      await invalidateInvitesQueries({
        accessToken: sessionAccessToken,
        page: invitePage,
        query: inviteSearch,
        queryClient,
        status: inviteStatusFilter,
      });
      onInviteCreated(preview);
      setMessage(`Invite created for ${created.email}.`);
      showToast({
        title: "Invite created",
        description: preview
          ? `${created.email} can now accept the organization invite.`
          : `${created.email} can now accept the invite from the emailed link.`,
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not create invite");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleUpdateMemberRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionAccessToken || !formState.selectedMember) {
      return;
    }

    setActionBusy(`member-role-${formState.selectedMember.id}`);
    setMessage("Updating member role");

    try {
      await updateMemberRoleMutation.mutateAsync({
        memberId: formState.selectedMember.id,
        role: formState.memberRoleValue,
      });
      formState.setMemberRoleDialogOpen(false);
      await invalidateMembersQueries({
        accessToken: sessionAccessToken,
        page: memberPage,
        query: memberSearch,
        queryClient,
        role: memberRoleFilter,
      });
      setMessage("Member role updated.");
      showToast({
        title: "Member updated",
        description: "The organization role was updated successfully.",
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not update member role");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!sessionAccessToken) {
      router.replace("/login");
      return;
    }

    setActionBusy(`remove-member-${memberId}`);
    setMessage("Removing member");

    try {
      await removeMemberMutation.mutateAsync(memberId);
      await invalidateMembersQueries({
        accessToken: sessionAccessToken,
        page: memberPage,
        query: memberSearch,
        queryClient,
        role: memberRoleFilter,
      });
      setMessage("Member removed.");
      showToast({
        title: "Member removed",
        description: "The organization member has been removed.",
        tone: "warning",
      });
    } catch (error) {
      handleSessionError(error, "Could not remove member");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    if (!sessionAccessToken) {
      router.replace("/login");
      return;
    }

    setActionBusy(`revoke-invite-${inviteId}`);
    setMessage("Revoking invite");

    try {
      await revokeInviteMutation.mutateAsync(inviteId);
      await invalidateInvitesQueries({
        accessToken: sessionAccessToken,
        page: invitePage,
        query: inviteSearch,
        queryClient,
        status: inviteStatusFilter,
      });
      setMessage("Invite revoked.");
      showToast({
        title: "Invite revoked",
        description: "The organization invite is no longer usable.",
        tone: "warning",
      });
    } catch (error) {
      handleSessionError(error, "Could not revoke invite");
    } finally {
      setActionBusy(null);
    }
  }

  return {
    handleCreateInvite,
    handleRemoveMember,
    handleRevokeInvite,
    handleUpdateMemberRole,
  };
}

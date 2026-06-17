import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buildStaticAppUrl } from "@/lib/auth-client";
import {
  DASHBOARD_ITEMS_PER_PAGE,
  pageCount,
  paginate,
} from "@/features/dashboard/lib/dashboard-pagination";
import {
  buildInviteColumns,
  buildMemberColumns,
} from "@/features/dashboard/lib/dashboard-columns";
import type { InvitePreview, RouterLike, ShowToast } from "@/features/dashboard/hooks/workspace.types";
import {
  createInvite,
  removeMember,
  revokeInvite,
  updateMemberRole,
} from "@/features/members/api/members.api";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import { useMembersFormState } from "@/features/members/hooks/use-members-form-state";
import type {
  InviteSummary,
  MemberSummary,
} from "@/features/members/types/members.types";
import type { DataTableColumn } from "@/components/ui/data-table";

export function useMembersWorkspace({
  handleSessionError,
  loadWorkspace,
  members,
  router,
  sessionAccessToken,
  sessionUserEmail,
  sessionUserRole,
  setActionBusy,
  setMessage,
  showToast,
  invites,
}: {
  handleSessionError: (error: unknown, fallback: string) => void;
  loadWorkspace: (accessToken: string) => Promise<void>;
  members: MemberSummary[];
  router: RouterLike;
  sessionAccessToken?: string;
  sessionUserEmail?: string;
  sessionUserRole?: string;
  setActionBusy: (value: string | null) => void;
  setMessage: (value: string) => void;
  showToast: ShowToast;
  invites: InviteSummary[];
}) {
  const queryClient = useQueryClient();
  const [lastCreatedInvite, setLastCreatedInvite] = useState<InvitePreview | null>(null);
  const formState = useMembersFormState();
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState("ALL");
  const [memberPage, setMemberPage] = useState(1);
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteStatusFilter, setInviteStatusFilter] = useState("ALL");
  const [invitePage, setInvitePage] = useState(1);

  useEffect(() => {
    setMemberPage(1);
  }, [memberRoleFilter, memberSearch]);

  useEffect(() => {
    setInvitePage(1);
  }, [inviteSearch, inviteStatusFilter]);

  const assignableRoles = useMemo(
    () =>
      sessionUserRole === "ORG_OWNER"
        ? ["ADMIN", "MEMBER", "VIEWER", "AUDITOR"]
        : ["MEMBER", "VIEWER", "AUDITOR"],
    [sessionUserRole],
  );

  const filteredMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();
    return members.filter((member) => {
      const matchesQuery =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query);
      const matchesRole = memberRoleFilter === "ALL" || member.role === memberRoleFilter;
      return matchesQuery && matchesRole;
    });
  }, [memberRoleFilter, memberSearch, members]);

  const filteredInvites = useMemo(() => {
    const query = inviteSearch.trim().toLowerCase();
    return invites.filter((invite) => {
      const matchesQuery =
        !query ||
        invite.email.toLowerCase().includes(query) ||
        invite.role.toLowerCase().includes(query);
      const matchesStatus =
        inviteStatusFilter === "ALL" || invite.status === inviteStatusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [inviteSearch, inviteStatusFilter, invites]);

  const paginatedMembers = paginate(filteredMembers, memberPage, DASHBOARD_ITEMS_PER_PAGE);
  const paginatedInvites = paginate(filteredInvites, invitePage, DASHBOARD_ITEMS_PER_PAGE);
  const memberPageCount = pageCount(filteredMembers.length, DASHBOARD_ITEMS_PER_PAGE);
  const invitePageCount = pageCount(filteredInvites.length, DASHBOARD_ITEMS_PER_PAGE);

  const memberColumns = useMemo<DataTableColumn<MemberSummary>[]>(
    () =>
      buildMemberColumns({
        actorEmail: sessionUserEmail || "",
        actorRole: sessionUserRole || "",
        onChangeRole: (member) => {
          formState.setSelectedMember(member);
          formState.setMemberRoleValue(member.role);
          formState.setMemberRoleDialogOpen(true);
        },
        onRemove: (member) => formState.setMemberRemoveTarget(member),
      }),
    [sessionUserEmail, sessionUserRole],
  );

  const inviteColumns = useMemo<DataTableColumn<InviteSummary>[]>(
    () =>
      buildInviteColumns({
        onRevoke: (invite) => formState.setInviteRevokeTarget(invite),
      }),
    [],
  );

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

      if (created.inviteToken && created.acceptPath) {
        setLastCreatedInvite({
          token: created.inviteToken,
          appUrl: buildStaticAppUrl(created.acceptPath, {
            token: created.inviteToken,
          }),
        });
      }

      formState.setInviteEmail("");
      formState.setInviteRole(assignableRoles[0] || "MEMBER");
      formState.setCreateInviteOpen(false);
      router.push("/dashboard/members");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.members(sessionAccessToken),
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.invites(sessionAccessToken),
        }),
      ]);
      setMessage(`Invite created for ${created.email}.`);
      showToast({
        title: "Invite created",
        description: `${created.email} can now accept the organization invite.`,
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
      await queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.members(sessionAccessToken),
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
      await queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.members(sessionAccessToken),
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
      await queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.invites(sessionAccessToken),
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

  function openCreateInvite() {
    router.push("/dashboard/members");
    formState.setCreateInviteOpen(true);
  }

  return {
    assignableRoles,
    ...formState,
    filteredInvites,
    filteredMembers,
    handleCreateInvite,
    handleRemoveMember,
    handleRevokeInvite,
    handleUpdateMemberRole,
    inviteColumns,
    invitePage,
    invitePageCount,
    inviteSearch,
    inviteStatusFilter,
    lastCreatedInvite,
    memberColumns,
    memberPage,
    memberPageCount,
    memberRoleFilter,
    memberSearch,
    openCreateInvite,
    paginatedInvites,
    paginatedMembers,
    setInvitePage,
    setInviteSearch,
    setInviteStatusFilter,
    setMemberPage,
    setMemberRoleFilter,
    setMemberSearch,
  };
}

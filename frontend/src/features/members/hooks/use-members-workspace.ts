import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DataTableColumn } from "@/components/ui/data-table";
import { buildStaticAppUrl } from "@/lib/auth-client";
import {
  DASHBOARD_ITEMS_PER_PAGE,
  pageCount,
} from "@/features/dashboard/lib/dashboard-pagination";
import type {
  InvitePreview,
  RouterLike,
  ShowToast,
} from "@/features/dashboard/hooks/workspace.types";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import {
  createInvite,
  fetchInvitesPage,
  fetchMembersPage,
  removeMember,
  resendInvite,
  revokeInvite,
  updateMemberRole,
} from "@/features/members/api/members.api";
import { buildInviteColumns, buildMemberColumns } from "@/features/members/lib/member-columns";
import type {
  InviteSummary,
  MemberSummary,
} from "@/features/members/types/members.types";

export function useMembersWorkspace({
  handleSessionError,
  router,
  sessionAccessToken,
  sessionUserEmail,
  sessionUserRole,
  setActionBusy,
  setMessage,
  showToast,
}: {
  handleSessionError: (error: unknown, fallback: string) => void;
  router: RouterLike;
  sessionAccessToken?: string;
  sessionUserEmail?: string;
  sessionUserRole?: string;
  setActionBusy: (value: string | null) => void;
  setMessage: (value: string) => void;
  showToast: ShowToast;
}) {
  const queryClient = useQueryClient();
  const [lastCreatedInvite, setLastCreatedInvite] = useState<InvitePreview | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState("ALL");
  const [memberPage, setMemberPage] = useState(1);
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteStatusFilter, setInviteStatusFilter] = useState("ALL");
  const [invitePage, setInvitePage] = useState(1);
  const [createInviteOpen, setCreateInviteOpen] = useState(false);
  const [memberRoleDialogOpen, setMemberRoleDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberSummary | null>(null);
  const [inviteRevokeTarget, setInviteRevokeTarget] = useState<InviteSummary | null>(null);
  const [memberRemoveTarget, setMemberRemoveTarget] = useState<MemberSummary | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [memberRoleValue, setMemberRoleValue] = useState("MEMBER");

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

  const membersPageParams = {
    page: memberPage - 1,
    size: DASHBOARD_ITEMS_PER_PAGE,
    query: memberSearch,
    role: memberRoleFilter,
  };

  const invitesPageParams = {
    page: invitePage - 1,
    size: DASHBOARD_ITEMS_PER_PAGE,
    query: inviteSearch,
    role: "ALL",
    status: inviteStatusFilter,
  };

  const membersPageQuery = useQuery({
    queryKey: dashboardQueryKeys.membersPage(sessionAccessToken, membersPageParams),
    queryFn: () =>
      fetchMembersPage(sessionAccessToken as string, {
        page: membersPageParams.page,
        size: membersPageParams.size,
        query: memberSearch.trim() || undefined,
        role: memberRoleFilter === "ALL" ? undefined : memberRoleFilter,
      }),
    enabled: Boolean(sessionAccessToken),
    placeholderData: (previous) => previous,
  });

  const invitesPageQuery = useQuery({
    queryKey: dashboardQueryKeys.invitesPage(sessionAccessToken, invitesPageParams),
    queryFn: () =>
      fetchInvitesPage(sessionAccessToken as string, {
        page: invitesPageParams.page,
        size: invitesPageParams.size,
        query: inviteSearch.trim() || undefined,
        status: inviteStatusFilter === "ALL" ? undefined : inviteStatusFilter,
      }),
    enabled: Boolean(sessionAccessToken),
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    if (membersPageQuery.error) {
      handleSessionError(membersPageQuery.error, "Could not load members");
    }
  }, [handleSessionError, membersPageQuery.error]);

  useEffect(() => {
    if (invitesPageQuery.error) {
      handleSessionError(invitesPageQuery.error, "Could not load invites");
    }
  }, [handleSessionError, invitesPageQuery.error]);

  const filteredMembers = membersPageQuery.data?.items ?? [];
  const filteredInvites = invitesPageQuery.data?.items ?? [];
  const memberPageCount =
    membersPageQuery.data?.totalPages ??
    pageCount(filteredMembers.length, DASHBOARD_ITEMS_PER_PAGE);
  const invitePageCount =
    invitesPageQuery.data?.totalPages ??
    pageCount(filteredInvites.length, DASHBOARD_ITEMS_PER_PAGE);

  const memberColumns = useMemo<DataTableColumn<MemberSummary>[]>(
    () =>
      buildMemberColumns({
        actorEmail: sessionUserEmail || "",
        actorRole: sessionUserRole || "",
        onChangeRole: (member) => {
          setSelectedMember(member);
          setMemberRoleValue(member.role);
          setMemberRoleDialogOpen(true);
        },
        onRemove: (member) => setMemberRemoveTarget(member),
      }),
    [sessionUserEmail, sessionUserRole],
  );

  const inviteColumns = useMemo<DataTableColumn<InviteSummary>[]>(
    () =>
      buildInviteColumns({
        onResend: (invite) => {
          void handleResendInvite(invite.id);
        },
        onRevoke: (invite) => setInviteRevokeTarget(invite),
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

  const resendInviteMutation = useMutation({
    mutationFn: (inviteId: string) => resendInvite(sessionAccessToken as string, inviteId),
  });

  async function invalidateMembers() {
    if (!sessionAccessToken) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.dashboardSummary(sessionAccessToken),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.members(sessionAccessToken),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.membersPage(sessionAccessToken, membersPageParams),
      }),
    ]);
  }

  async function invalidateInvites() {
    if (!sessionAccessToken) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.dashboardSummary(sessionAccessToken),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.invites(sessionAccessToken),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.invitesPage(sessionAccessToken, invitesPageParams),
      }),
    ]);
  }

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
        email: inviteEmail,
        role: inviteRole,
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

      setInviteEmail("");
      setInviteRole(assignableRoles[0] || "MEMBER");
      setCreateInviteOpen(false);
      await invalidateInvites();
      setLastCreatedInvite(preview);
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
    if (!sessionAccessToken || !selectedMember) {
      return;
    }

    setActionBusy(`member-role-${selectedMember.id}`);
    setMessage("Updating member role");

    try {
      await updateMemberRoleMutation.mutateAsync({
        memberId: selectedMember.id,
        role: memberRoleValue,
      });
      setMemberRoleDialogOpen(false);
      await invalidateMembers();
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
      await invalidateMembers();
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
      await invalidateInvites();
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

  async function handleResendInvite(inviteId: string) {
    if (!sessionAccessToken) {
      router.replace("/login");
      return;
    }

    setActionBusy(`resend-invite-${inviteId}`);
    setMessage("Resending invite");

    try {
      const resent = await resendInviteMutation.mutateAsync(inviteId);
      const preview =
        resent.inviteToken && resent.acceptPath
          ? {
              token: resent.inviteToken,
              appUrl: buildStaticAppUrl(resent.acceptPath, {
                token: resent.inviteToken,
              }),
            }
          : null;

      await invalidateInvites();
      setLastCreatedInvite(preview);
      setMessage(`Invite resent to ${resent.email}.`);
      showToast({
        title: "Invite resent",
        description: preview
          ? `${resent.email} now has a fresh organization invite link.`
          : `${resent.email} was sent a fresh organization invite.`,
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not resend invite");
    } finally {
      setActionBusy(null);
    }
  }

  return {
    assignableRoles,
    createInviteOpen,
    filteredInvitesLength: invitesPageQuery.data?.totalElements ?? filteredInvites.length,
    filteredMembersLength: membersPageQuery.data?.totalElements ?? filteredMembers.length,
    handleCreateInvite,
    handleRemoveMember,
    handleRevokeInvite,
    handleResendInvite,
    handleUpdateMemberRole,
    inviteColumns,
    inviteEmail,
    invitePage,
    invitePageCount,
    invites: filteredInvites,
    invitesTotal: invitesPageQuery.data?.totalElements ?? filteredInvites.length,
    inviteRevokeTarget,
    inviteRole,
    inviteSearch,
    inviteStatusFilter,
    lastCreatedInvite,
    loadingMembers: membersPageQuery.isLoading || invitesPageQuery.isLoading,
    memberColumns,
    memberPage,
    memberPageCount,
    memberRemoveTarget,
    members: filteredMembers,
    membersTotal: membersPageQuery.data?.totalElements ?? filteredMembers.length,
    memberRoleDialogOpen,
    memberRoleFilter,
    memberRoleValue,
    memberSearch,
    selectedMember,
    setCreateInviteOpen,
    setInviteEmail,
    setInvitePage,
    setInviteRevokeTarget,
    setInviteRole,
    setInviteSearch,
    setInviteStatusFilter,
    setMemberPage,
    setMemberRemoveTarget,
    setMemberRoleDialogOpen,
    setMemberRoleFilter,
    setMemberRoleValue,
    setMemberSearch,
    setSelectedMember,
  };
}

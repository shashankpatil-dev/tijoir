import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DASHBOARD_ITEMS_PER_PAGE, pageCount } from "@/features/dashboard/lib/dashboard-pagination";
import type {
  InvitePreview,
  RouterLike,
  ShowToast,
} from "@/features/dashboard/hooks/workspace.types";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import {
  fetchInvitesPage,
  fetchMembersPage,
} from "@/features/members/api/members.api";
import { useMemberActions } from "@/features/members/hooks/use-member-actions";
import { useMembersFormState } from "@/features/members/hooks/use-members-form-state";
import {
  buildInvitesPageParams,
  buildMembersPageParams,
} from "@/features/members/hooks/member-query-utils";
import { buildInviteColumns, buildMemberColumns } from "@/features/members/lib/member-columns";
import type {
  InviteSummary,
  MemberSummary,
} from "@/features/members/types/members.types";
import type { DataTableColumn } from "@/components/ui/data-table";

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
  const formState = useMembersFormState();

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

  const membersPageParams = buildMembersPageParams({
    page: memberPage,
    query: memberSearch,
    role: memberRoleFilter,
  });
  const invitesPageParams = buildInvitesPageParams({
    page: invitePage,
    query: inviteSearch,
    status: inviteStatusFilter,
  });

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
  const paginatedMembers = filteredMembers;
  const paginatedInvites = filteredInvites;
  const memberPageCount =
    membersPageQuery.data?.totalPages ?? pageCount(filteredMembers.length, DASHBOARD_ITEMS_PER_PAGE);
  const invitePageCount =
    invitesPageQuery.data?.totalPages ?? pageCount(filteredInvites.length, DASHBOARD_ITEMS_PER_PAGE);

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
    [formState, sessionUserEmail, sessionUserRole],
  );

  const inviteColumns = useMemo<DataTableColumn<InviteSummary>[]>(
    () =>
      buildInviteColumns({
        onRevoke: (invite) => formState.setInviteRevokeTarget(invite),
      }),
    [formState],
  );

  const {
    handleCreateInvite,
    handleRemoveMember,
    handleRevokeInvite,
    handleUpdateMemberRole,
  } = useMemberActions({
    assignableRoles,
    formState,
    handleSessionError,
    invitePage,
    inviteSearch,
    inviteStatusFilter,
    memberPage,
    memberRoleFilter,
    memberSearch,
    onInviteCreated: (preview) => setLastCreatedInvite(preview),
    router,
    sessionAccessToken,
    setActionBusy,
    setMessage,
    showToast,
  });

  async function refreshMembers() {
    if (!sessionAccessToken) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "members-page", sessionAccessToken],
      }),
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "invites-page", sessionAccessToken],
      }),
    ]);
  }

  return {
    assignableRoles,
    ...formState,
    filteredInvitesLength: invitesPageQuery.data?.totalElements ?? filteredInvites.length,
    filteredMembersLength: membersPageQuery.data?.totalElements ?? filteredMembers.length,
    handleCreateInvite,
    handleRemoveMember,
    handleRevokeInvite,
    handleUpdateMemberRole,
    inviteColumns,
    invitePage,
    invitePageCount,
    invites: paginatedInvites,
    invitesTotal: invitesPageQuery.data?.totalElements ?? filteredInvites.length,
    inviteSearch,
    inviteStatusFilter,
    lastCreatedInvite,
    loadingMembers: membersPageQuery.isLoading || invitesPageQuery.isLoading,
    memberColumns,
    memberPage,
    memberPageCount,
    members: paginatedMembers,
    membersTotal: membersPageQuery.data?.totalElements ?? filteredMembers.length,
    memberRoleFilter,
    memberSearch,
    refreshMembers,
    setInvitePage,
    setInviteSearch,
    setInviteStatusFilter,
    setMemberPage,
    setMemberRoleFilter,
    setMemberSearch,
  };
}

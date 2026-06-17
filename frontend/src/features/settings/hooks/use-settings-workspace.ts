import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import type { RouterLike, ShowToast } from "@/features/dashboard/hooks/workspace.types";
import {
  fetchOrganizationPolicy,
  updateOrganizationPolicy,
} from "@/features/settings/api/settings.api";

export function useSettingsWorkspace({
  handleSessionError,
  router,
  sessionAccessToken,
  setActionBusy,
  setMessage,
  showToast,
}: {
  handleSessionError: (error: unknown, fallback: string) => void;
  router: RouterLike;
  sessionAccessToken?: string;
  setActionBusy: (value: string | null) => void;
  setMessage: (value: string) => void;
  showToast: ShowToast;
}) {
  const queryClient = useQueryClient();
  const [defaultShareLinkExpiryHours, setDefaultShareLinkExpiryHours] = useState("");
  const [requireVendorContractForShareLinks, setRequireVendorContractForShareLinks] =
    useState("false");
  const [allowViewOnce, setAllowViewOnce] = useState("true");
  const [allowViewUntilRevoked, setAllowViewUntilRevoked] = useState("true");
  const [allowRotationNotifyOnly, setAllowRotationNotifyOnly] = useState("true");
  const [rotationReminderDays, setRotationReminderDays] = useState("30");

  const policyQuery = useQuery({
    queryKey: dashboardQueryKeys.organizationPolicy(sessionAccessToken),
    queryFn: () => fetchOrganizationPolicy(sessionAccessToken as string),
    enabled: Boolean(sessionAccessToken),
  });

  useEffect(() => {
    if (!policyQuery.data) {
      return;
    }
    setDefaultShareLinkExpiryHours(
      policyQuery.data.defaultShareLinkExpiryHours != null
        ? String(policyQuery.data.defaultShareLinkExpiryHours)
        : "",
    );
    setRequireVendorContractForShareLinks(
      String(policyQuery.data.requireVendorContractForShareLinks),
    );
    setAllowViewOnce(String(policyQuery.data.allowViewOnce));
    setAllowViewUntilRevoked(String(policyQuery.data.allowViewUntilRevoked));
    setAllowRotationNotifyOnly(String(policyQuery.data.allowRotationNotifyOnly));
    setRotationReminderDays(
      policyQuery.data.rotationReminderDays != null
        ? String(policyQuery.data.rotationReminderDays)
        : "",
    );
  }, [policyQuery.data]);

  useEffect(() => {
    if (policyQuery.error) {
      handleSessionError(policyQuery.error, "Could not load organization policy");
    }
  }, [handleSessionError, policyQuery.error]);

  const updatePolicyMutation = useMutation({
    mutationFn: () =>
      updateOrganizationPolicy(sessionAccessToken as string, {
        defaultShareLinkExpiryHours: defaultShareLinkExpiryHours
          ? Number(defaultShareLinkExpiryHours)
          : null,
        requireVendorContractForShareLinks:
          requireVendorContractForShareLinks === "true",
        allowViewOnce: allowViewOnce === "true",
        allowViewUntilRevoked: allowViewUntilRevoked === "true",
        allowRotationNotifyOnly: allowRotationNotifyOnly === "true",
        rotationReminderDays: rotationReminderDays ? Number(rotationReminderDays) : null,
      }),
  });

  async function handleUpdatePolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionAccessToken) {
      router.replace("/login");
      return;
    }

    setActionBusy("update-policy");
    setMessage("Updating organization policy");
    try {
      await updatePolicyMutation.mutateAsync();
      await queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.organizationPolicy(sessionAccessToken),
      });
      showToast({
        title: "Policy updated",
        description: "Organization policy settings were saved.",
        tone: "success",
      });
      setMessage("Organization policy updated.");
    } catch (error) {
      handleSessionError(error, "Could not update organization policy");
    } finally {
      setActionBusy(null);
    }
  }

  return {
    allowRotationNotifyOnly,
    allowViewOnce,
    allowViewUntilRevoked,
    defaultShareLinkExpiryHours,
    handleUpdatePolicy,
    loadingPolicy: policyQuery.isLoading,
    policyUpdatedAt: policyQuery.data?.updatedAt || null,
    requireVendorContractForShareLinks,
    rotationReminderDays,
    setAllowRotationNotifyOnly,
    setAllowViewOnce,
    setAllowViewUntilRevoked,
    setDefaultShareLinkExpiryHours,
    setRequireVendorContractForShareLinks,
    setRotationReminderDays,
  };
}

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmMfaEnrollmentRequest,
  disableMfaRequest,
  fetchMfaStatus,
  startMfaEnrollmentRequest,
} from "@/features/auth/api/auth.api";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import type { RouterLike, ShowToast } from "@/features/dashboard/hooks/workspace.types";
import {
  fetchOrganizationPolicy,
  updateOrganizationPolicy,
} from "@/features/settings/api/settings.api";
import type { MfaSecurityState } from "@/features/settings/types/settings.types";

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
  const [mfaSetup, setMfaSetup] = useState<MfaSecurityState | null>(null);
  const [mfaEnrollmentCode, setMfaEnrollmentCode] = useState("");
  const [mfaDisableCode, setMfaDisableCode] = useState("");
  const [mfaDisablePassword, setMfaDisablePassword] = useState("");
  const [mfaEnrollmentOpen, setMfaEnrollmentOpen] = useState(false);
  const [mfaDisableOpen, setMfaDisableOpen] = useState(false);

  const policyQuery = useQuery({
    queryKey: dashboardQueryKeys.organizationPolicy(sessionAccessToken),
    queryFn: () => fetchOrganizationPolicy(sessionAccessToken as string),
    enabled: Boolean(sessionAccessToken),
  });

  const mfaStatusQuery = useQuery({
    queryKey: ["mfa-status", sessionAccessToken],
    queryFn: () => fetchMfaStatus(sessionAccessToken as string),
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

  useEffect(() => {
    if (mfaStatusQuery.error) {
      handleSessionError(mfaStatusQuery.error, "Could not load MFA security status");
    }
  }, [handleSessionError, mfaStatusQuery.error]);

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

  const startMfaMutation = useMutation({
    mutationFn: () => startMfaEnrollmentRequest(sessionAccessToken as string),
  });

  const confirmMfaMutation = useMutation({
    mutationFn: () =>
      confirmMfaEnrollmentRequest(
        sessionAccessToken as string,
        mfaSetup?.challengeId as string,
        mfaEnrollmentCode,
      ),
  });

  const disableMfaMutation = useMutation({
    mutationFn: () =>
      disableMfaRequest(
        sessionAccessToken as string,
        mfaDisablePassword,
        mfaDisableCode,
      ),
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

  async function refreshPolicy() {
    if (!sessionAccessToken) {
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.organizationPolicy(sessionAccessToken),
    });
  }

  async function openMfaEnrollment() {
    if (!sessionAccessToken) {
      router.replace("/login");
      return;
    }

    setActionBusy("start-mfa-enrollment");
    setMessage("Preparing MFA enrollment");
    try {
      const response = await startMfaMutation.mutateAsync();
      setMfaSetup({
        challengeId: response.challengeId,
        expiresAt: response.expiresAt,
        otpauthUri: response.otpauthUri,
        secret: response.secret,
      });
      setMfaEnrollmentCode("");
      setMfaEnrollmentOpen(true);
      showToast({
        title: "MFA enrollment started",
        description: "Register the shared secret in your authenticator app, then confirm with a code.",
        tone: "success",
      });
      setMessage("MFA enrollment challenge created.");
    } catch (error) {
      handleSessionError(error, "Could not start MFA enrollment");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleConfirmMfaEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionAccessToken || !mfaSetup) {
      router.replace("/login");
      return;
    }

    setActionBusy("confirm-mfa-enrollment");
    setMessage("Confirming MFA enrollment");
    try {
      await confirmMfaMutation.mutateAsync();
      await queryClient.invalidateQueries({
        queryKey: ["mfa-status", sessionAccessToken],
      });
      setMfaEnrollmentOpen(false);
      setMfaSetup(null);
      setMfaEnrollmentCode("");
      showToast({
        title: "MFA enabled",
        description: "Authenticator-based verification is now required at login.",
        tone: "success",
      });
      setMessage("MFA enrollment confirmed.");
    } catch (error) {
      handleSessionError(error, "Could not confirm MFA enrollment");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleDisableMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionAccessToken) {
      router.replace("/login");
      return;
    }

    setActionBusy("disable-mfa");
    setMessage("Disabling MFA");
    try {
      await disableMfaMutation.mutateAsync();
      await queryClient.invalidateQueries({
        queryKey: ["mfa-status", sessionAccessToken],
      });
      setMfaDisableOpen(false);
      setMfaDisableCode("");
      setMfaDisablePassword("");
      showToast({
        title: "MFA disabled",
        description: "Authenticator verification has been removed from this account.",
        tone: "success",
      });
      setMessage("MFA disabled.");
    } catch (error) {
      handleSessionError(error, "Could not disable MFA");
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
    mfa: {
      confirmEnrollment: handleConfirmMfaEnrollment,
      disable: handleDisableMfa,
      disableBusy: disableMfaMutation.isPending,
      disableCode: mfaDisableCode,
      disableOpen: mfaDisableOpen,
      disablePassword: mfaDisablePassword,
      enabled: mfaStatusQuery.data?.enabled ?? false,
      enrolledAt: mfaStatusQuery.data?.enrolledAt ?? null,
      enrollmentBusy: startMfaMutation.isPending || confirmMfaMutation.isPending,
      enrollmentCode: mfaEnrollmentCode,
      enrollmentOpen: mfaEnrollmentOpen,
      loading: mfaStatusQuery.isLoading,
      openDisable: () => setMfaDisableOpen(true),
      openEnrollment: openMfaEnrollment,
      setDisableCode: setMfaDisableCode,
      setDisableOpen: setMfaDisableOpen,
      setDisablePassword: setMfaDisablePassword,
      setEnrollmentCode: setMfaEnrollmentCode,
      setEnrollmentOpen: setMfaEnrollmentOpen,
      setup: mfaSetup,
    },
    policyUpdatedAt: policyQuery.data?.updatedAt || null,
    requireVendorContractForShareLinks,
    refreshPolicy,
    rotationReminderDays,
    setAllowRotationNotifyOnly,
    setAllowViewOnce,
    setAllowViewUntilRevoked,
    setDefaultShareLinkExpiryHours,
    setRequireVendorContractForShareLinks,
    setRotationReminderDays,
  };
}

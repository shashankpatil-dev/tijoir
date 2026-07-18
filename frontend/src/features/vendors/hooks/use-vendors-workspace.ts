import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiRequestError } from "@/lib/api/errors";
import type { DataTableColumn } from "@/components/ui/data-table";
import {
  buildIncomingVendorContractColumns,
  buildVendorColumns,
  buildVendorContractColumns,
  buildVendorGrantColumns,
} from "@/features/dashboard/lib/dashboard-columns";
import {
  DASHBOARD_ITEMS_PER_PAGE,
  pageCount,
} from "@/features/dashboard/lib/dashboard-pagination";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import type { RouterLike, ShowToast } from "@/features/dashboard/hooks/workspace.types";
import { fetchSecrets } from "@/features/secrets/api/secrets.api";
import type { SecretSummary } from "@/features/secrets/types/secrets.types";
import { fetchShareLinksPage, revokeShareLink } from "@/features/share-links/api/share-links.api";
import { buildShareColumns } from "@/features/share-links/lib/share-link-columns";
import type { ContractPermission } from "@/features/share-links/types/share-links.types";
import type { ShareLinkResponse } from "@/features/share-links/types/share-links.types";
import {
  acceptIncomingVendorContract,
  createVendor,
  createVendorContract,
  createVendorContractGrant,
  fetchIncomingVendorContractsPage,
  fetchVendorContractGrantsPage,
  fetchVendorContractsPage,
  fetchVendorsPage,
  offboardVendor,
  revealVendorContractGrant,
  rejectIncomingVendorContract,
  revokeVendorContract,
  revokeVendorContractGrant,
} from "@/features/vendors/api/vendors.api";
import type {
  IncomingVendorContractResponse,
  RevealVendorContractGrantResponse,
  VendorContractResponse,
  VendorContractGrantResponse,
  VendorResponse,
} from "@/features/vendors/types/vendors.types";

export function useVendorsWorkspace({
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
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorStatusFilter, setVendorStatusFilter] = useState("ALL");
  const [vendorPage, setVendorPage] = useState(1);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [incomingContractStatusFilter, setIncomingContractStatusFilter] = useState("ALL");
  const [incomingContractPage, setIncomingContractPage] = useState(1);
  const [selectedIncomingContractId, setSelectedIncomingContractId] = useState("");
  const [selectedIncomingGrantId, setSelectedIncomingGrantId] = useState("");
  const [incomingGrantStatusFilter, setIncomingGrantStatusFilter] = useState("ALL");
  const [incomingGrantPage, setIncomingGrantPage] = useState(1);
  const [revealedIncomingGrant, setRevealedIncomingGrant] =
    useState<RevealVendorContractGrantResponse | null>(null);
  const [contractStatusFilter, setContractStatusFilter] = useState("ALL");
  const [contractPage, setContractPage] = useState(1);
  const [selectedContractId, setSelectedContractId] = useState("");
  const [grantStatusFilter, setGrantStatusFilter] = useState("ALL");
  const [grantPage, setGrantPage] = useState(1);
  const [shareActivityStatusFilter, setShareActivityStatusFilter] = useState("ALL");
  const [shareActivityPage, setShareActivityPage] = useState(1);
  const [createVendorOpen, setCreateVendorOpen] = useState(false);
  const [createContractOpen, setCreateContractOpen] = useState(false);
  const [createGrantOpen, setCreateGrantOpen] = useState(false);
  const [vendorName, setVendorName] = useState("Primary SFTP Vendor");
  const [vendorContactName, setVendorContactName] = useState("Primary operator");
  const [vendorContactEmail, setVendorContactEmail] = useState("");
  const [linkedOrganizationSlug, setLinkedOrganizationSlug] = useState("");
  const [vendorNotes, setVendorNotes] = useState(
    "Handles the organization external integration workflow.",
  );
  const [contractPermission, setContractPermission] = useState("VIEW_UNTIL_REVOKED");
  const [contractExpiry, setContractExpiry] = useState("");
  const [grantSecretId, setGrantSecretId] = useState("");
  const [grantPermission, setGrantPermission] = useState("VIEW_UNTIL_REVOKED");
  const [grantExpiry, setGrantExpiry] = useState("");
  const [contractRevokeTarget, setContractRevokeTarget] =
    useState<VendorContractResponse | null>(null);
  const [grantRevokeTarget, setGrantRevokeTarget] =
    useState<VendorContractGrantResponse | null>(null);
  const [vendorOffboardTarget, setVendorOffboardTarget] =
    useState<VendorResponse | null>(null);
  const [shareRevokeTarget, setShareRevokeTarget] =
    useState<ShareLinkResponse | null>(null);

  useEffect(() => {
    setVendorPage(1);
  }, [vendorSearch, vendorStatusFilter]);

  useEffect(() => {
    setIncomingContractPage(1);
  }, [incomingContractStatusFilter]);

  useEffect(() => {
    setIncomingGrantPage(1);
  }, [incomingGrantStatusFilter, selectedIncomingContractId]);

  useEffect(() => {
    setSelectedIncomingGrantId("");
    setRevealedIncomingGrant(null);
  }, [selectedIncomingContractId]);

  useEffect(() => {
    setContractPage(1);
  }, [contractStatusFilter, selectedVendorId]);

  useEffect(() => {
    setGrantPage(1);
  }, [grantStatusFilter, selectedContractId]);

  useEffect(() => {
    setShareActivityPage(1);
  }, [selectedContractId, shareActivityStatusFilter]);

  const vendorsPageQuery = useQuery({
    queryKey: dashboardQueryKeys.vendorsPage(sessionAccessToken, {
      page: vendorPage - 1,
      size: DASHBOARD_ITEMS_PER_PAGE,
      query: vendorSearch,
      status: vendorStatusFilter,
    }),
    queryFn: () =>
      fetchVendorsPage(sessionAccessToken as string, {
        page: vendorPage - 1,
        size: DASHBOARD_ITEMS_PER_PAGE,
        query: vendorSearch.trim() || undefined,
        status:
          vendorStatusFilter === "ALL"
            ? undefined
            : (vendorStatusFilter as "ACTIVE" | "OFFBOARDED"),
      }),
    enabled: Boolean(sessionAccessToken),
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    if (
      vendorsPageQuery.error &&
      !(vendorsPageQuery.error instanceof ApiRequestError && vendorsPageQuery.error.status === 403)
    ) {
      handleSessionError(vendorsPageQuery.error, "Could not load vendors");
    }
  }, [handleSessionError, vendorsPageQuery.error]);

  const paginatedVendors = vendorsPageQuery.data?.items ?? [];
  const vendorsTotal = vendorsPageQuery.data?.totalElements ?? paginatedVendors.length;
  const vendorPageCount =
    vendorsPageQuery.data?.totalPages ??
    pageCount(paginatedVendors.length, DASHBOARD_ITEMS_PER_PAGE);

  useEffect(() => {
    // Keep the selection valid without auto-opening the detail drawer: clear it
    // only when the selected vendor is no longer on the current page.
    setSelectedVendorId((current) =>
      current && paginatedVendors.some((vendor) => vendor.id === current) ? current : "",
    );
  }, [paginatedVendors]);

  const selectedVendor =
    paginatedVendors.find((vendor) => vendor.id === selectedVendorId) || null;

  const secretOptionsQuery = useQuery({
    queryKey: dashboardQueryKeys.secretOptions(sessionAccessToken),
    queryFn: () => fetchSecrets(sessionAccessToken as string),
    enabled: Boolean(sessionAccessToken && createGrantOpen),
    staleTime: 60_000,
  });

  const secretOptions: SecretSummary[] = secretOptionsQuery.data ?? [];

  useEffect(() => {
    if (secretOptionsQuery.error) {
      handleSessionError(secretOptionsQuery.error, "Could not load secret options");
    }
  }, [handleSessionError, secretOptionsQuery.error]);

  const incomingContractsPageQuery = useQuery({
    queryKey: dashboardQueryKeys.incomingVendorContractsPage(sessionAccessToken, {
      page: incomingContractPage - 1,
      size: DASHBOARD_ITEMS_PER_PAGE,
      status: incomingContractStatusFilter,
    }),
    queryFn: () =>
      fetchIncomingVendorContractsPage(sessionAccessToken as string, {
        page: incomingContractPage - 1,
        size: DASHBOARD_ITEMS_PER_PAGE,
        status:
          incomingContractStatusFilter === "ALL"
            ? undefined
            : (incomingContractStatusFilter as
                | "PROPOSED"
                | "ACTIVE"
                | "REJECTED"
                | "REVOKED"
                | "EXPIRED"),
      }),
    enabled: Boolean(sessionAccessToken),
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    if (
      incomingContractsPageQuery.error &&
      !(incomingContractsPageQuery.error instanceof ApiRequestError
        && incomingContractsPageQuery.error.status === 403)
    ) {
      handleSessionError(incomingContractsPageQuery.error, "Could not load incoming vendor contracts");
    }
  }, [handleSessionError, incomingContractsPageQuery.error]);

  const paginatedIncomingContracts = incomingContractsPageQuery.data?.items ?? [];
  const incomingContractsTotal =
    incomingContractsPageQuery.data?.totalElements ?? paginatedIncomingContracts.length;
  const incomingContractPageCount =
    incomingContractsPageQuery.data?.totalPages ??
    pageCount(paginatedIncomingContracts.length, DASHBOARD_ITEMS_PER_PAGE);

  useEffect(() => {
    setSelectedIncomingContractId((current) =>
      current && paginatedIncomingContracts.some((contract) => contract.id === current) ? current : "",
    );
  }, [paginatedIncomingContracts]);

  const selectedIncomingContract =
    paginatedIncomingContracts.find((contract) => contract.id === selectedIncomingContractId) || null;

  const incomingGrantsPageQuery = useQuery({
    queryKey: dashboardQueryKeys.vendorContractGrantsPage(
      sessionAccessToken,
      selectedIncomingContractId,
      {
        page: incomingGrantPage - 1,
        size: DASHBOARD_ITEMS_PER_PAGE,
        status: incomingGrantStatusFilter,
      },
    ),
    queryFn: () =>
      fetchVendorContractGrantsPage(sessionAccessToken as string, selectedIncomingContractId, {
        page: incomingGrantPage - 1,
        size: DASHBOARD_ITEMS_PER_PAGE,
        status:
          incomingGrantStatusFilter === "ALL"
            ? undefined
            : (incomingGrantStatusFilter as "ACTIVE" | "REVOKED" | "EXPIRED"),
      }),
    enabled: Boolean(sessionAccessToken && selectedIncomingContractId),
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    if (incomingGrantsPageQuery.error) {
      handleSessionError(
        incomingGrantsPageQuery.error,
        "Could not load incoming contract secret grants",
      );
    }
  }, [handleSessionError, incomingGrantsPageQuery.error]);

  const incomingContractGrants = incomingGrantsPageQuery.data?.items ?? [];
  const incomingGrantsTotal =
    incomingGrantsPageQuery.data?.totalElements ?? incomingContractGrants.length;
  const incomingGrantPageCount =
    incomingGrantsPageQuery.data?.totalPages ??
    pageCount(incomingContractGrants.length, DASHBOARD_ITEMS_PER_PAGE);
  const selectedIncomingGrant =
    incomingContractGrants.find((grant) => grant.id === selectedIncomingGrantId) ?? null;

  useEffect(() => {
    if (!secretOptions.length) {
      setGrantSecretId("");
      return;
    }

    setGrantSecretId((current) =>
      current && secretOptions.some((secret) => secret.id === current)
        ? current
        : secretOptions[0].id,
    );
  }, [secretOptions]);

  const contractsPageQuery = useQuery({
    queryKey: dashboardQueryKeys.vendorContractsPage(sessionAccessToken, selectedVendorId, {
      page: contractPage - 1,
      size: DASHBOARD_ITEMS_PER_PAGE,
      status: contractStatusFilter,
    }),
    queryFn: () =>
      fetchVendorContractsPage(sessionAccessToken as string, selectedVendorId, {
        page: contractPage - 1,
        size: DASHBOARD_ITEMS_PER_PAGE,
        status:
          contractStatusFilter === "ALL"
            ? undefined
            : (contractStatusFilter as
                | "PROPOSED"
                | "ACTIVE"
                | "REJECTED"
                | "REVOKED"
                | "EXPIRED"),
      }),
    enabled: Boolean(sessionAccessToken && selectedVendorId),
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    if (contractsPageQuery.error) {
      handleSessionError(contractsPageQuery.error, "Could not load vendor contracts");
    }
  }, [contractsPageQuery.error, handleSessionError]);

  const vendorContracts = contractsPageQuery.data?.items ?? [];
  const contractsTotal = contractsPageQuery.data?.totalElements ?? vendorContracts.length;
  const contractPageCount =
    contractsPageQuery.data?.totalPages ??
    pageCount(vendorContracts.length, DASHBOARD_ITEMS_PER_PAGE);

  useEffect(() => {
    setSelectedContractId((current) =>
      current && vendorContracts.some((contract) => contract.id === current) ? current : "",
    );
  }, [vendorContracts]);

  const selectedContract =
    vendorContracts.find((contract) => contract.id === selectedContractId) || null;

  const grantsPageQuery = useQuery({
    queryKey: dashboardQueryKeys.vendorContractGrantsPage(sessionAccessToken, selectedContractId, {
      page: grantPage - 1,
      size: DASHBOARD_ITEMS_PER_PAGE,
      status: grantStatusFilter,
    }),
    queryFn: () =>
      fetchVendorContractGrantsPage(sessionAccessToken as string, selectedContractId, {
        page: grantPage - 1,
        size: DASHBOARD_ITEMS_PER_PAGE,
        status:
          grantStatusFilter === "ALL"
            ? undefined
            : (grantStatusFilter as "ACTIVE" | "REVOKED" | "EXPIRED"),
      }),
    enabled: Boolean(sessionAccessToken && selectedContractId),
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    if (grantsPageQuery.error) {
      handleSessionError(grantsPageQuery.error, "Could not load vendor secret grants");
    }
  }, [grantsPageQuery.error, handleSessionError]);

  const vendorGrants = grantsPageQuery.data?.items ?? [];
  const grantsTotal = grantsPageQuery.data?.totalElements ?? vendorGrants.length;
  const grantPageCount =
    grantsPageQuery.data?.totalPages ??
    pageCount(vendorGrants.length, DASHBOARD_ITEMS_PER_PAGE);

  const contractShareActivityQuery = useQuery({
    queryKey: dashboardQueryKeys.shareLinksPage(sessionAccessToken, {
      page: shareActivityPage - 1,
      size: DASHBOARD_ITEMS_PER_PAGE,
      query: "",
      permission: "ALL",
      status: shareActivityStatusFilter,
      contractId: selectedContractId || undefined,
    }),
    queryFn: () =>
      fetchShareLinksPage(sessionAccessToken as string, {
        page: shareActivityPage - 1,
        size: DASHBOARD_ITEMS_PER_PAGE,
        status: shareActivityStatusFilter === "ALL" ? undefined : shareActivityStatusFilter,
        contractId: selectedContractId || undefined,
      }),
    enabled: Boolean(sessionAccessToken && selectedContractId),
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    if (contractShareActivityQuery.error) {
      handleSessionError(contractShareActivityQuery.error, "Could not load contract share activity");
    }
  }, [contractShareActivityQuery.error, handleSessionError]);

  const contractShareActivity = contractShareActivityQuery.data?.items ?? [];
  const shareActivityTotal =
    contractShareActivityQuery.data?.totalElements ?? contractShareActivity.length;
  const shareActivityPageCount =
    contractShareActivityQuery.data?.totalPages ??
    pageCount(contractShareActivity.length, DASHBOARD_ITEMS_PER_PAGE);

  const vendorColumns = useMemo<DataTableColumn<VendorResponse>[]>(
    () => buildVendorColumns(),
    [],
  );

  const incomingContractColumns: DataTableColumn<IncomingVendorContractResponse>[] =
    buildIncomingVendorContractColumns({
      onAccept: (contract) => {
        void handleAcceptIncomingContract(contract);
      },
      onReject: (contract) => {
        void handleRejectIncomingContract(contract);
      },
    });

  const contractColumns = useMemo<DataTableColumn<VendorContractResponse>[]>(
    () =>
      buildVendorContractColumns({
        onRevoke: (contract) => setContractRevokeTarget(contract),
      }),
    [],
  );

  const grantColumns = useMemo<DataTableColumn<VendorContractGrantResponse>[]>(
    () =>
      buildVendorGrantColumns({
        onRevoke: (grant) => setGrantRevokeTarget(grant),
      }),
    [],
  );

  const incomingGrantColumns = useMemo<DataTableColumn<VendorContractGrantResponse>[]>(
    () =>
      buildVendorGrantColumns({
        onReveal: (grant) => {
          void handleRevealIncomingGrant(grant);
        },
      }),
    [],
  );

  const shareActivityColumns = useMemo<DataTableColumn<ShareLinkResponse>[]>(
    () =>
      buildShareColumns({
        copyText: async () => {
          // Share activity is inventory only in the vendor drawer.
        },
        onRevoke: (shareLink) => setShareRevokeTarget(shareLink),
      }),
    [],
  );

  const createVendorMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      contactName?: string | null;
      contactEmail?: string | null;
      notes?: string | null;
      linkedOrganizationSlug?: string | null;
    }) => createVendor(sessionAccessToken as string, payload),
  });

  const createVendorContractMutation = useMutation({
    mutationFn: (payload: {
      vendorId: string;
      permission: ContractPermission;
      expiresAt?: string | null;
    }) =>
      createVendorContract(sessionAccessToken as string, payload.vendorId, {
        permission: payload.permission,
        expiresAt: payload.expiresAt,
      }),
  });

  const revokeVendorContractMutation = useMutation({
    mutationFn: (payload: { vendorId: string; contractId: string }) =>
      revokeVendorContract(sessionAccessToken as string, payload.vendorId, payload.contractId),
  });

  const acceptIncomingVendorContractMutation = useMutation({
    mutationFn: (contractId: string) =>
      acceptIncomingVendorContract(sessionAccessToken as string, contractId),
  });

  const rejectIncomingVendorContractMutation = useMutation({
    mutationFn: (contractId: string) =>
      rejectIncomingVendorContract(sessionAccessToken as string, contractId),
  });

  const createVendorContractGrantMutation = useMutation({
    mutationFn: (payload: {
      contractId: string;
      secretId: string;
      permission: ContractPermission;
      expiresAt?: string | null;
    }) =>
      createVendorContractGrant(sessionAccessToken as string, payload.contractId, {
        secretId: payload.secretId,
        permission: payload.permission,
        expiresAt: payload.expiresAt,
      }),
  });

  const revokeVendorContractGrantMutation = useMutation({
    mutationFn: (payload: { contractId: string; grantId: string }) =>
      revokeVendorContractGrant(sessionAccessToken as string, payload.contractId, payload.grantId),
  });

  const revealIncomingVendorGrantMutation = useMutation({
    mutationFn: (payload: { contractId: string; grantId: string }) =>
      revealVendorContractGrant(sessionAccessToken as string, payload.contractId, payload.grantId),
  });

  const offboardVendorMutation = useMutation({
    mutationFn: (vendorId: string) => offboardVendor(sessionAccessToken as string, vendorId),
  });

  const revokeShareLinkMutation = useMutation({
    mutationFn: (shareLinkId: string) => revokeShareLink(shareLinkId, sessionAccessToken as string),
  });

  async function invalidateVendors(vendorId?: string) {
    if (!sessionAccessToken) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.dashboardSummary(sessionAccessToken),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.vendors(sessionAccessToken),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.vendorsPage(sessionAccessToken, {
          page: vendorPage - 1,
          size: DASHBOARD_ITEMS_PER_PAGE,
          query: vendorSearch,
          status: vendorStatusFilter,
        }),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.incomingVendorContractsPage(sessionAccessToken, {
          page: incomingContractPage - 1,
          size: DASHBOARD_ITEMS_PER_PAGE,
          status: incomingContractStatusFilter,
        }),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.shareLinks(sessionAccessToken),
      }),
      ...(vendorId
        ? [
            queryClient.invalidateQueries({
              queryKey: dashboardQueryKeys.vendorContractsPage(sessionAccessToken, vendorId, {
                page: contractPage - 1,
                size: DASHBOARD_ITEMS_PER_PAGE,
                status: contractStatusFilter,
              }),
            }),
          ]
        : []),
      ...(selectedContractId
        ? [
            queryClient.invalidateQueries({
              queryKey: dashboardQueryKeys.vendorContractGrantsPage(sessionAccessToken, selectedContractId, {
                page: grantPage - 1,
                size: DASHBOARD_ITEMS_PER_PAGE,
                status: grantStatusFilter,
              }),
            }),
            queryClient.invalidateQueries({
              queryKey: dashboardQueryKeys.shareLinksPage(sessionAccessToken, {
                page: shareActivityPage - 1,
                size: DASHBOARD_ITEMS_PER_PAGE,
                query: "",
                permission: "ALL",
                status: shareActivityStatusFilter,
                contractId: selectedContractId,
              }),
            }),
          ]
        : []),
    ]);
  }

  async function handleCreateVendor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionAccessToken) {
      router.replace("/login");
      return;
    }

    setActionBusy("create-vendor");
    setMessage("Creating vendor");

    try {
      const created = await createVendorMutation.mutateAsync({
        name: vendorName.trim(),
        contactName: vendorContactName.trim() || null,
        contactEmail: vendorContactEmail.trim() || null,
        notes: vendorNotes.trim() || null,
        linkedOrganizationSlug: linkedOrganizationSlug.trim() || null,
      });
      setCreateVendorOpen(false);
      setSelectedVendorId(created.id);
      await invalidateVendors(created.id);
      setMessage(`Vendor ${created.name} created.`);
      showToast({
        title: "Vendor created",
        description: created.linkedOrganizationSlug
          ? `${created.name} is linked to ${created.linkedOrganizationSlug} for counterparty contract acceptance.`
          : `${created.name} is ready for contract and share-link workflows.`,
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not create vendor");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleCreateVendorContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionAccessToken || !selectedVendor) {
      router.replace("/dashboard/vendors");
      return;
    }

    setActionBusy("create-vendor-contract");
    setMessage("Creating vendor contract");

    try {
      const created = await createVendorContractMutation.mutateAsync({
        vendorId: selectedVendor.id,
        permission: contractPermission as ContractPermission,
        expiresAt: contractExpiry ? new Date(contractExpiry).toISOString() : null,
      });
      setCreateContractOpen(false);
      setSelectedContractId(created.id);
      await invalidateVendors(selectedVendor.id);
      setMessage(
        created.status === "PROPOSED"
          ? `Contract proposal sent for ${selectedVendor.name}.`
          : `Contract created for ${selectedVendor.name}.`,
      );
      showToast({
        title: created.status === "PROPOSED" ? "Contract proposal sent" : "Contract created",
        description:
          created.status === "PROPOSED"
            ? `${selectedVendor.name} must accept this proposal before grants or vendor delivery can begin.`
            : `${selectedVendor.name} now has a vendor contract boundary ready for secret grants.`,
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not create vendor contract");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleRevokeVendorContract() {
    if (!sessionAccessToken || !contractRevokeTarget) {
      router.replace("/dashboard/vendors");
      return;
    }

    setActionBusy(`revoke-contract-${contractRevokeTarget.id}`);
    setMessage("Revoking vendor contract");

    try {
      await revokeVendorContractMutation.mutateAsync({
        vendorId: contractRevokeTarget.vendorId,
        contractId: contractRevokeTarget.id,
      });
      await invalidateVendors(contractRevokeTarget.vendorId);
      setMessage("Vendor contract revoked.");
      showToast({
        title: "Contract revoked",
        description: "The vendor contract is no longer active.",
        tone: "warning",
      });
    } catch (error) {
      handleSessionError(error, "Could not revoke vendor contract");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleAcceptIncomingContract(contract: IncomingVendorContractResponse) {
    if (!sessionAccessToken) {
      router.replace("/dashboard/vendors");
      return;
    }

    setActionBusy(`accept-incoming-contract-${contract.id}`);
    setMessage("Accepting incoming vendor contract");

    try {
      const accepted = await acceptIncomingVendorContractMutation.mutateAsync(contract.id);
      await invalidateVendors();
      setMessage(`Contract accepted from ${accepted.ownerOrganizationName}.`);
      showToast({
        title: "Contract accepted",
        description: `The vendor boundary from ${accepted.ownerOrganizationName} is now active.`,
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not accept incoming vendor contract");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleRejectIncomingContract(contract: IncomingVendorContractResponse) {
    if (!sessionAccessToken) {
      router.replace("/dashboard/vendors");
      return;
    }

    setActionBusy(`reject-incoming-contract-${contract.id}`);
    setMessage("Rejecting incoming vendor contract");

    try {
      const rejected = await rejectIncomingVendorContractMutation.mutateAsync(contract.id);
      await invalidateVendors();
      setMessage(`Contract rejected from ${rejected.ownerOrganizationName}.`);
      showToast({
        title: "Contract rejected",
        description: `The proposal from ${rejected.ownerOrganizationName} has been closed and cannot receive grants.`,
        tone: "warning",
      });
    } catch (error) {
      handleSessionError(error, "Could not reject incoming vendor contract");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleCreateVendorContractGrant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionAccessToken || !selectedContract) {
      router.replace("/dashboard/vendors");
      return;
    }

    setActionBusy("create-vendor-contract-grant");
    setMessage("Creating vendor secret grant");

    try {
      const created = await createVendorContractGrantMutation.mutateAsync({
        contractId: selectedContract.id,
        secretId: grantSecretId,
        permission: grantPermission as ContractPermission,
        expiresAt: grantExpiry ? new Date(grantExpiry).toISOString() : null,
      });
      setCreateGrantOpen(false);
      await invalidateVendors(selectedVendor?.id);
      setMessage(`Secret grant created for ${created.secretKey}.`);
      showToast({
        title: "Secret grant created",
        description: `${created.secretKey} is now governed by the selected vendor contract.`,
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not create vendor secret grant");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleRevokeVendorContractGrant() {
    if (!sessionAccessToken || !grantRevokeTarget) {
      router.replace("/dashboard/vendors");
      return;
    }

    setActionBusy(`revoke-grant-${grantRevokeTarget.id}`);
    setMessage("Revoking vendor secret grant");

    try {
      await revokeVendorContractGrantMutation.mutateAsync({
        contractId: grantRevokeTarget.contractId,
        grantId: grantRevokeTarget.id,
      });
      await invalidateVendors(selectedVendor?.id);
      setMessage("Vendor secret grant revoked.");
      showToast({
        title: "Secret grant revoked",
        description: "This secret is no longer available under the selected vendor contract.",
        tone: "warning",
      });
    } catch (error) {
      handleSessionError(error, "Could not revoke vendor secret grant");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleOffboardVendor() {
    if (!sessionAccessToken || !vendorOffboardTarget) {
      router.replace("/dashboard/vendors");
      return;
    }

    setActionBusy(`offboard-vendor-${vendorOffboardTarget.id}`);
    setMessage("Offboarding vendor");

    try {
      const result = await offboardVendorMutation.mutateAsync(vendorOffboardTarget.id);
      await invalidateVendors(vendorOffboardTarget.id);
      setMessage(`Vendor ${result.vendorName} offboarded.`);
      showToast({
        title: "Vendor offboarded",
        description: `${result.revokedContracts} contracts and ${result.revokedShareLinks} share links were revoked.`,
        tone: "warning",
      });
    } catch (error) {
      handleSessionError(error, "Could not offboard vendor");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleRevokeShareActivityLink() {
    if (!sessionAccessToken || !shareRevokeTarget) {
      router.replace("/dashboard/vendors");
      return;
    }

    setActionBusy(`revoke-contract-share-${shareRevokeTarget.id}`);
    setMessage("Revoking contract share link");

    try {
      await revokeShareLinkMutation.mutateAsync(shareRevokeTarget.id);
      await invalidateVendors(selectedVendor?.id);
      setMessage("Contract share link revoked.");
      showToast({
        title: "Share link revoked",
        description: "Recipient delivery under the selected contract has been closed.",
        tone: "warning",
      });
    } catch (error) {
      handleSessionError(error, "Could not revoke contract share link");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleRevealIncomingGrant(grant: VendorContractGrantResponse) {
    if (!sessionAccessToken) {
      router.replace("/dashboard/vendors");
      return;
    }

    setActionBusy(`reveal-incoming-grant-${grant.id}`);
    setMessage("Revealing vendor contract secret");

    try {
      const revealed = await revealIncomingVendorGrantMutation.mutateAsync({
        contractId: grant.contractId,
        grantId: grant.id,
      });
      setSelectedIncomingGrantId(grant.id);
      setRevealedIncomingGrant(revealed);
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "incoming-vendor-contracts-page", sessionAccessToken],
      });
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "vendor-contract-grants-page", sessionAccessToken, grant.contractId],
      });
      setMessage(`Revealed ${revealed.secretKey}.`);
      showToast({
        title: "Contract grant revealed",
        description:
          revealed.permission === "VIEW_ONCE"
            ? `${revealed.secretKey} was revealed and consumed under one-time access.`
            : `${revealed.secretKey} was revealed through the active vendor contract.`,
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not reveal vendor contract secret");
    } finally {
      setActionBusy(null);
    }
  }

  function openCreateContract() {
    if (!selectedVendor) {
      setMessage("Select a vendor before creating a contract.");
      return;
    }
    setCreateContractOpen(true);
  }

  function openCreateGrant() {
    if (!selectedContract) {
      setMessage("Select a contract before creating a secret grant.");
      return;
    }
    if (selectedContract.status !== "ACTIVE") {
      setMessage("Wait for the counterparty to accept this contract before creating grants.");
      return;
    }
    setGrantPermission(selectedContract.permission);
    setCreateGrantOpen(true);
  }

  return {
    contractColumns,
    contractExpiry,
    incomingContractColumns,
    incomingContractPage,
    incomingContractPageCount,
    incomingGrantColumns,
    incomingGrantPage,
    incomingGrantPageCount,
    incomingGrantsLoading:
      incomingGrantsPageQuery.isLoading || incomingGrantsPageQuery.isFetching,
    incomingGrantsTotal,
    incomingGrantStatusFilter,
    incomingContractStatusFilter,
    contractPage,
    contractPageCount,
    contractPermission,
    contractRevokeTarget,
    contractsLoading: contractsPageQuery.isLoading && Boolean(selectedVendorId),
    contractsTotal,
    contractStatusFilter,
    createGrantOpen,
    createContractOpen,
    createVendorOpen,
    grantColumns,
    grantExpiry,
    grantPage,
    grantPageCount,
    grantPermission,
    grantRevokeTarget,
    grantsLoading: grantsPageQuery.isLoading && Boolean(selectedContractId),
    grantsTotal,
    grantSecretId,
    grantStatusFilter,
    handleAcceptIncomingContract,
    handleRevealIncomingGrant,
    handleRevokeShareActivityLink,
    handleCreateVendor,
    handleCreateVendorContract,
    handleCreateVendorContractGrant,
    handleOffboardVendor,
    handleRevokeVendorContract,
    handleRevokeVendorContractGrant,
    loadingVendors: vendorsPageQuery.isLoading,
    openCreateGrant,
    openCreateContract,
    contractShareActivity,
    shareActivityColumns,
    shareActivityLoading: contractShareActivityQuery.isLoading && Boolean(selectedContractId),
    shareActivityPage,
    shareActivityPageCount,
    shareActivityStatusFilter,
    shareActivityTotal,
    paginatedVendorGrants: vendorGrants,
    paginatedVendorContracts: vendorContracts,
    incomingContractGrants,
    paginatedIncomingContracts,
    paginatedVendors,
    revealedIncomingGrant,
    secretOptions,
    selectedIncomingContract,
    selectedIncomingContractId,
    selectedIncomingGrant,
    selectedIncomingGrantId,
    selectedContract,
    selectedContractId,
    selectedVendor,
    selectedVendorId,
    setContractExpiry,
    setContractPage,
    setContractPermission,
    setContractRevokeTarget,
    setContractStatusFilter,
    setCreateGrantOpen,
    setCreateContractOpen,
    setCreateVendorOpen,
    setGrantExpiry,
    setGrantPage,
    setGrantPermission,
    setGrantRevokeTarget,
    setGrantSecretId,
    setGrantStatusFilter,
    setIncomingContractPage,
    setIncomingGrantPage,
    setIncomingGrantStatusFilter,
    setIncomingContractStatusFilter,
    setLinkedOrganizationSlug,
    setShareActivityPage,
    setShareActivityStatusFilter,
    setShareRevokeTarget,
    setSelectedIncomingContractId,
    setSelectedIncomingGrantId,
    setSelectedContractId,
    setSelectedVendorId,
    setVendorContactEmail,
    setVendorContactName,
    setVendorName,
    setVendorNotes,
    setVendorOffboardTarget,
    setVendorPage,
    setVendorSearch,
    setVendorStatusFilter,
    vendorColumns,
    vendorContactEmail,
    vendorContactName,
    linkedOrganizationSlug,
    vendorName,
    vendorNotes,
    vendorOffboardTarget,
    shareRevokeTarget,
    vendorPage,
    vendorPageCount,
    vendorSearch,
    vendorStatusFilter,
    incomingContractsLoading:
      incomingContractsPageQuery.isLoading
      || incomingContractsPageQuery.isFetching,
    incomingContractsTotal,
    vendorsAvailable: !(
      vendorsPageQuery.error instanceof ApiRequestError && vendorsPageQuery.error.status === 403
    ),
    vendorsTotal,
  };
}

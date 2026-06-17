import { useState } from "react";
import type {
  VendorContractResponse,
  VendorResponse,
} from "@/features/vendors/types/vendors.types";

export function useVendorFormState() {
  const [createVendorOpen, setCreateVendorOpen] = useState(false);
  const [createContractOpen, setCreateContractOpen] = useState(false);
  const [vendorName, setVendorName] = useState("Primary SFTP Vendor");
  const [vendorContactName, setVendorContactName] = useState("Primary operator");
  const [vendorContactEmail, setVendorContactEmail] = useState("");
  const [vendorNotes, setVendorNotes] = useState(
    "Handles the organization external integration workflow.",
  );
  const [contractSecretId, setContractSecretId] = useState("");
  const [contractPermission, setContractPermission] = useState("VIEW_UNTIL_REVOKED");
  const [contractExpiry, setContractExpiry] = useState("");
  const [contractRevokeTarget, setContractRevokeTarget] =
    useState<VendorContractResponse | null>(null);
  const [vendorOffboardTarget, setVendorOffboardTarget] =
    useState<VendorResponse | null>(null);

  return {
    contractExpiry,
    contractPermission,
    contractRevokeTarget,
    contractSecretId,
    createContractOpen,
    createVendorOpen,
    setContractExpiry,
    setContractPermission,
    setContractRevokeTarget,
    setContractSecretId,
    setCreateContractOpen,
    setCreateVendorOpen,
    setVendorContactEmail,
    setVendorContactName,
    setVendorName,
    setVendorNotes,
    setVendorOffboardTarget,
    vendorContactEmail,
    vendorContactName,
    vendorName,
    vendorNotes,
    vendorOffboardTarget,
  };
}

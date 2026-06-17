import { useEffect, useState } from "react";

export function useVendorListState() {
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorStatusFilter, setVendorStatusFilter] = useState("ALL");
  const [vendorPage, setVendorPage] = useState(1);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [contractStatusFilter, setContractStatusFilter] = useState("ALL");
  const [contractPage, setContractPage] = useState(1);

  useEffect(() => {
    setVendorPage(1);
  }, [vendorSearch, vendorStatusFilter]);

  useEffect(() => {
    setContractPage(1);
  }, [contractStatusFilter, selectedVendorId]);

  return {
    contractPage,
    contractStatusFilter,
    selectedVendorId,
    setContractPage,
    setContractStatusFilter,
    setSelectedVendorId,
    setVendorPage,
    setVendorSearch,
    setVendorStatusFilter,
    vendorPage,
    vendorSearch,
    vendorStatusFilter,
  };
}

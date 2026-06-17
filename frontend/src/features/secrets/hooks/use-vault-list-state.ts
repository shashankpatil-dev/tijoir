import { useEffect, useState } from "react";

export function useVaultListState() {
  const [vaultSearch, setVaultSearch] = useState("");
  const [vaultStatusFilter, setVaultStatusFilter] = useState("ALL");
  const [vaultTypeFilter, setVaultTypeFilter] = useState("ALL");
  const [vaultPage, setVaultPage] = useState(1);

  useEffect(() => {
    setVaultPage(1);
  }, [vaultSearch, vaultStatusFilter, vaultTypeFilter]);

  return {
    setVaultPage,
    setVaultSearch,
    setVaultStatusFilter,
    setVaultTypeFilter,
    vaultPage,
    vaultSearch,
    vaultStatusFilter,
    vaultTypeFilter,
  };
}

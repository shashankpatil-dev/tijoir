export type DashboardViewKey =
  | "overview"
  | "vault"
  | "vendors"
  | "share"
  | "members"
  | "audit"
  | "settings"
  | "recipient";

export function viewFromPath(pathname: string): DashboardViewKey {
  if (pathname.includes("/dashboard/vault")) {
    return "vault";
  }
  if (pathname.includes("/dashboard/share-links")) {
    return "share";
  }
  if (pathname.includes("/dashboard/vendors")) {
    return "vendors";
  }
  if (pathname.includes("/dashboard/members")) {
    return "members";
  }
  if (pathname.includes("/dashboard/audit")) {
    return "audit";
  }
  if (pathname.includes("/dashboard/settings")) {
    return "settings";
  }
  if (pathname.includes("/dashboard/recipient")) {
    return "recipient";
  }
  return "overview";
}

export function viewPath(view: DashboardViewKey) {
  switch (view) {
    case "vault":
      return "/dashboard/vault";
    case "vendors":
      return "/dashboard/vendors";
    case "share":
      return "/dashboard/share-links";
    case "members":
      return "/dashboard/members";
    case "audit":
      return "/dashboard/audit";
    case "settings":
      return "/dashboard/settings";
    case "recipient":
      return "/dashboard/recipient";
    case "overview":
    default:
      return "/dashboard/overview";
  }
}

export function titleForView(view: DashboardViewKey) {
  switch (view) {
    case "vault":
      return "Vault";
    case "vendors":
      return "Vendors";
    case "share":
      return "Share Links";
    case "members":
      return "Members";
    case "audit":
      return "Audit Log";
    case "settings":
      return "Settings";
    case "recipient":
      return "Recipient View";
    case "overview":
    default:
      return "Overview";
  }
}

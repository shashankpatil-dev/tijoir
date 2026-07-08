export type DashboardViewKey =
  | "overview"
  | "vault"
  | "vendors"
  | "share"
  | "notifications"
  | "organization"
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
  if (pathname.includes("/dashboard/notifications")) {
    return "notifications";
  }
  if (pathname.includes("/dashboard/organization")) {
    return "organization";
  }
  if (pathname.includes("/dashboard/members")) {
    return "organization";
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
    case "notifications":
      return "/dashboard/notifications";
    case "organization":
      return "/dashboard/organization";
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
    case "notifications":
      return "Notifications";
    case "organization":
      return "Organization";
    case "audit":
      return "Audit Log";
    case "settings":
      return "Settings";
    case "recipient":
      return "Recipient Access";
    case "overview":
    default:
      return "Overview";
  }
}

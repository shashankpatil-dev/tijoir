export type DashboardViewKey =
  | "overview"
  | "vault"
  | "share"
  | "members"
  | "recipient";

export function viewFromPath(pathname: string): DashboardViewKey {
  if (pathname.includes("/dashboard/vault")) {
    return "vault";
  }
  if (pathname.includes("/dashboard/share-links")) {
    return "share";
  }
  if (pathname.includes("/dashboard/members")) {
    return "members";
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
    case "share":
      return "/dashboard/share-links";
    case "members":
      return "/dashboard/members";
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
    case "share":
      return "Share Links";
    case "members":
      return "Members";
    case "recipient":
      return "Recipient View";
    case "overview":
    default:
      return "Overview";
  }
}

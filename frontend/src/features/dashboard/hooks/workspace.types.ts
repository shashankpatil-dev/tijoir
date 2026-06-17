import type { AuthResponse } from "@/features/auth/types/auth.types";

export type RouterLike = {
  push: (href: string) => void;
  replace: (href: string) => void;
};

export type ToastTone = "success" | "warning" | "error" | "info";

export type ShowToast = (options: {
  title: string;
  description: string;
  tone: ToastTone;
}) => void;

export type SharePreview = {
  token: string;
  appUrl: string;
};

export type InvitePreview = {
  token: string;
  appUrl: string;
};

export type WorkspaceDeps = {
  router: RouterLike;
  showToast: ShowToast;
};

export type DashboardHookArgs = WorkspaceDeps & {
  initialSession: AuthResponse;
  pathname: string;
  removeSession: () => void;
};

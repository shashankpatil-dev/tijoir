"use client";

import { apiRequest } from "@/lib/api/client";
import type {
  AuthResponse,
  GoogleExchangeResponse,
  InviteResolutionResponse,
  RegisterResponse,
} from "@/features/auth/types/auth.types";

export async function loginRequest(email: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerRequest(payload: {
  organizationName: string;
  organizationEmail: string;
  userName: string;
  userEmail: string;
  password: string;
}) {
  return apiRequest<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyEmailRequest(token: string) {
  return apiRequest<{ verified: boolean; message: string }>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function resendVerificationRequest(email: string) {
  return apiRequest<RegisterResponse>("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function googleExchangeRequest(idToken: string) {
  return apiRequest<GoogleExchangeResponse>(
    "/api/auth/google/exchange",
    { method: "POST", body: JSON.stringify({ idToken }) },
  );
}

export async function googleRegisterRequest(idToken: string, organizationName: string) {
  return apiRequest<AuthResponse>("/api/auth/google/register", {
    method: "POST",
    body: JSON.stringify({ idToken, organizationName }),
  });
}

export async function googleLinkRequest(accessToken: string, idToken: string) {
  return apiRequest<{ message: string }>("/api/auth/google/link", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ idToken }),
  });
}

export async function updateProfileRequest(accessToken: string, name: string) {
  return apiRequest<AuthResponse>("/api/auth/me", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ name }),
  });
}

export async function changePasswordRequest(
  accessToken: string,
  currentPassword: string,
  newPassword: string,
) {
  return apiRequest<{ message: string }>("/api/auth/password/change", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function updateOrganizationRequest(accessToken: string, name: string) {
  return apiRequest<{ id: string; name: string; slug: string; email: string }>(
    "/api/organization",
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ name }),
    },
  );
}

export async function forgotPasswordRequest(email: string) {
  return apiRequest<{ message: string }>("/api/auth/password/forgot", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordRequest(token: string, newPassword: string) {
  return apiRequest<{ message: string }>("/api/auth/password/reset", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}

export async function currentUserRequest(accessToken: string) {
  return apiRequest<AuthResponse>("/api/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function switchOrganizationRequest(
  accessToken: string,
  organizationId: string,
) {
  return apiRequest<AuthResponse>("/api/auth/switch-organization", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ organizationId }),
  });
}

export async function resolveInviteRequest(token: string) {
  const searchParams = new URLSearchParams({ token });
  return apiRequest<InviteResolutionResponse>(
    `/api/organization/invites/resolve?${searchParams.toString()}`,
  );
}

export async function acceptInviteRequest(
  token: string,
  payload?: { name?: string; password?: string },
  accessToken?: string,
) {
  return apiRequest<AuthResponse>("/api/organization/invites/accept", {
    method: "POST",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    body: JSON.stringify({
      token,
      ...(payload?.name ? { name: payload.name } : {}),
      ...(payload?.password ? { password: payload.password } : {}),
    }),
  });
}

export async function refreshRequest() {
  return apiRequest<AuthResponse>("/api/auth/refresh", {
    method: "POST",
  });
}

export async function logoutRequest() {
  return apiRequest<void>("/api/auth/logout", {
    method: "POST",
  });
}

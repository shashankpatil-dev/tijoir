"use client";

import { apiRequest } from "@/lib/api/client";
import type {
  AuthResponse,
  MfaEnrollmentStartResponse,
  MfaStatusResponse,
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

export async function currentUserRequest(accessToken: string) {
  return apiRequest<AuthResponse>("/api/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
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

export async function verifyMfaChallengeRequest(
  challengeId: string,
  code: string,
) {
  return apiRequest<AuthResponse>("/api/auth/mfa/verify", {
    method: "POST",
    body: JSON.stringify({ challengeId, code }),
  });
}

export async function fetchMfaStatus(accessToken: string) {
  return apiRequest<MfaStatusResponse>("/api/auth/mfa/status", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function startMfaEnrollmentRequest(accessToken: string) {
  return apiRequest<MfaEnrollmentStartResponse>("/api/auth/mfa/enroll/start", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function confirmMfaEnrollmentRequest(
  accessToken: string,
  challengeId: string,
  code: string,
) {
  return apiRequest<MfaStatusResponse>("/api/auth/mfa/enroll/confirm", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ challengeId, code }),
  });
}

export async function disableMfaRequest(
  accessToken: string,
  password: string,
  code: string,
) {
  return apiRequest<MfaStatusResponse>("/api/auth/mfa/disable", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ password, code }),
  });
}

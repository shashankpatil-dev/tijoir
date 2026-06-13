"use client";

import { FormEvent, useMemo, useState } from "react";

type ApiError = {
  message?: string;
  details?: string[];
};

type AuthResponse = {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  user: {
    name: string;
    email: string;
    role: string;
    emailVerified: boolean;
  };
  organization: {
    name: string;
    slug: string;
    email: string;
  };
};

type RegisterResponse = {
  emailVerificationToken?: string;
  emailVerificationExpiresAt?: string;
};

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8080";

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = body as ApiError;
    throw new Error(error.message || `Request failed with ${response.status}`);
  }

  return body as T;
}

export default function HomePage() {
  const [organizationName, setOrganizationName] = useState("Acme Integrations");
  const [organizationEmail, setOrganizationEmail] = useState("security@acme.test");
  const [userName, setUserName] = useState("Acme Owner");
  const [userEmail, setUserEmail] = useState("owner@acme.test");
  const [password, setPassword] = useState("StrongPass@123");
  const [verificationToken, setVerificationToken] = useState("");
  const [loginEmail, setLoginEmail] = useState("owner@acme.test");
  const [loginPassword, setLoginPassword] = useState("StrongPass@123");
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [message, setMessage] = useState("Ready");
  const [busy, setBusy] = useState(false);

  const status = useMemo(() => {
    if (!session) {
      return "Signed out";
    }
    return `${session.user.role} in ${session.organization.slug}`;
  }, [session]);

  async function runAction<T>(label: string, action: () => Promise<T>) {
    setBusy(true);
    setMessage(label);
    try {
      const result = await action();
      setMessage(`${label} complete`);
      return result;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unexpected error");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await runAction("Registration", () =>
      apiRequest<RegisterResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          organizationName,
          organizationEmail,
          userName,
          userEmail,
          password,
        }),
      }),
    );

    if (result?.emailVerificationToken) {
      setVerificationToken(result.emailVerificationToken);
      setLoginEmail(userEmail);
      setLoginPassword(password);
    }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction("Email verification", () =>
      apiRequest("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token: verificationToken }),
      }),
    );
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await runAction("Login", () =>
      apiRequest<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      }),
    );

    if (result) {
      setSession(result);
    }
  }

  async function loadMe() {
    if (!session?.accessToken) {
      setMessage("Login first");
      return;
    }

    const result = await runAction("Load profile", () =>
      apiRequest<AuthResponse>("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }),
    );

    if (result) {
      setSession(result);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-4 py-6 text-[#1e1c18] sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-[#d8d0c2] pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#42745d]">
              Tijoir Auth Console
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Organization access setup
            </h1>
          </div>
          <div className="rounded-md border border-[#cfc7b8] bg-white px-4 py-3 text-sm shadow-sm">
            <p className="font-medium">{status}</p>
            <p className="mt-1 text-[#6f675c]">API: {apiBaseUrl}</p>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1fr_1fr_0.9fr]">
          <form onSubmit={register} className="rounded-md border border-[#d8d0c2] bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Register owner</h2>
              <p className="mt-1 text-sm text-[#6f675c]">
                Creates an organization and the first ORG_OWNER account.
              </p>
            </div>

            <Field label="Organization name" value={organizationName} onChange={setOrganizationName} />
            <Field label="Organization email" value={organizationEmail} onChange={setOrganizationEmail} type="email" />
            <Field label="Owner name" value={userName} onChange={setUserName} />
            <Field label="Owner email" value={userEmail} onChange={setUserEmail} type="email" />
            <Field label="Password" value={password} onChange={setPassword} type="password" />

            <button className="mt-4 w-full rounded-md bg-[#24543e] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" disabled={busy}>
              Register
            </button>
          </form>

          <form onSubmit={verify} className="rounded-md border border-[#d8d0c2] bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Verify email</h2>
              <p className="mt-1 text-sm text-[#6f675c]">
                MVP mode returns this token directly until email delivery is added.
              </p>
            </div>

            <label className="block">
              <span className="text-sm font-medium">Verification token</span>
              <textarea
                className="mt-1 min-h-32 w-full rounded-md border border-[#cfc7b8] px-3 py-2 text-sm outline-none focus:border-[#24543e]"
                value={verificationToken}
                onChange={(event) => setVerificationToken(event.target.value)}
              />
            </label>

            <button className="mt-4 w-full rounded-md bg-[#24543e] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" disabled={busy}>
              Verify
            </button>
          </form>

          <section className="flex flex-col gap-5">
            <form onSubmit={login} className="rounded-md border border-[#d8d0c2] bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Login</h2>
              <Field label="Email" value={loginEmail} onChange={setLoginEmail} type="email" />
              <Field label="Password" value={loginPassword} onChange={setLoginPassword} type="password" />
              <button className="mt-4 w-full rounded-md bg-[#24543e] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" disabled={busy}>
                Login
              </button>
            </form>

            <div className="rounded-md border border-[#d8d0c2] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Session</h2>
                <button
                  className="rounded-md border border-[#cfc7b8] px-3 py-2 text-sm font-medium disabled:opacity-60"
                  onClick={loadMe}
                  disabled={busy}
                >
                  Refresh /me
                </button>
              </div>
              <p className="mt-3 rounded-md bg-[#eef3ec] px-3 py-2 text-sm text-[#24543e]">
                {message}
              </p>
              {session ? (
                <dl className="mt-4 space-y-2 text-sm">
                  <Row label="Name" value={session.user.name} />
                  <Row label="Email" value={session.user.email} />
                  <Row label="Verified" value={String(session.user.emailVerified)} />
                  <Row label="Organization" value={session.organization.name} />
                  <Row label="Token expires" value={new Date(session.expiresAt).toLocaleString()} />
                </dl>
              ) : (
                <p className="mt-4 text-sm text-[#6f675c]">No active session.</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="mt-3 block">
      <span className="text-sm font-medium">{label}</span>
      <input
        className="mt-1 w-full rounded-md border border-[#cfc7b8] px-3 py-2 text-sm outline-none focus:border-[#24543e]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        required
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3">
      <dt className="text-[#6f675c]">{label}</dt>
      <dd className="break-words font-medium">{value}</dd>
    </div>
  );
}

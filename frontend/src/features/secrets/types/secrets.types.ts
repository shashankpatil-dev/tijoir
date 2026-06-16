export type SecretType =
  | "PASSWORD"
  | "API_KEY"
  | "WEBHOOK_SECRET"
  | "SSH_PUBLIC_KEY"
  | "SSH_PRIVATE_KEY"
  | "SFTP_PASSWORD"
  | "TOKEN"
  | "CERTIFICATE"
  | "CUSTOM";

export type SecretStatus = "ACTIVE" | "REVOKED";

export type SecretSummary = {
  id: string;
  name: string;
  secretKey: string;
  type: SecretType;
  status: SecretStatus;
  currentVersionNumber: number;
  createdAt: string;
};

export type SecretDetail = {
  id: string;
  name: string;
  secretKey: string;
  type: SecretType;
  description?: string | null;
  status: SecretStatus;
  currentVersionNumber: number;
  createdByName: string;
  createdByEmail: string;
  createdAt: string;
};

export type RevealSecretResponse = {
  id: string;
  secretKey: string;
  type: SecretType;
  versionNumber: number;
  value: string;
};

export type GeneratedSecretResponse = {
  type: SecretType;
  length: number;
  value: string;
};

export const SECRET_TYPES: SecretType[] = [
  "PASSWORD",
  "API_KEY",
  "WEBHOOK_SECRET",
  "SSH_PUBLIC_KEY",
  "SSH_PRIVATE_KEY",
  "SFTP_PASSWORD",
  "TOKEN",
  "CERTIFICATE",
  "CUSTOM",
];

export const GENERATOR_SUPPORTED_SECRET_TYPES = new Set<SecretType>([
  "PASSWORD",
  "API_KEY",
  "WEBHOOK_SECRET",
  "SFTP_PASSWORD",
  "TOKEN",
  "CUSTOM",
]);

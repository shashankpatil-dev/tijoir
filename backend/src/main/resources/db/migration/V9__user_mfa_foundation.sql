alter table users
    add column if not exists mfa_enabled boolean not null default false,
    add column if not exists mfa_secret_ciphertext text,
    add column if not exists mfa_enrolled_at timestamp with time zone;

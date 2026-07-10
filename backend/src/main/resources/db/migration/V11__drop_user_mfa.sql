alter table users drop column if exists mfa_enabled;
alter table users drop column if exists mfa_secret_ciphertext;
alter table users drop column if exists mfa_enrolled_at;

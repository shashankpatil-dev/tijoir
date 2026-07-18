create table public_secret_drops (
    id uuid primary key,
    token_hash varchar(64) not null unique,
    secret_name varchar(255) not null,
    secret_key varchar(255) not null,
    secret_type varchar(64) not null,
    sender_label varchar(255),
    recipient_label varchar(255),
    storage_backend varchar(64) not null,
    payload_ref text,
    payload_ciphertext text,
    status varchar(32) not null,
    expires_at timestamptz not null,
    consumed_at timestamptz,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create index idx_public_secret_drops_status on public_secret_drops(status);
create index idx_public_secret_drops_expires_at on public_secret_drops(expires_at);

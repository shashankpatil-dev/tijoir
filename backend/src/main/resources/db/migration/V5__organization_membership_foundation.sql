create table organization_invites (
    id uuid primary key,
    org_id uuid not null references organizations (id) on delete cascade,
    invited_by_user_id uuid not null references users (id) on delete cascade,
    email varchar(255) not null,
    role varchar(32) not null,
    token_hash varchar(128) not null unique,
    expires_at timestamp with time zone not null,
    accepted_at timestamp with time zone,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create index idx_organization_invites_org_id_created_at
    on organization_invites (org_id, created_at desc);

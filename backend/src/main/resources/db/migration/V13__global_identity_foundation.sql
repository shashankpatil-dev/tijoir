create table identity_users (
    id uuid primary key,
    legacy_user_id uuid unique references users (id) on delete set null,
    email varchar(255) not null unique,
    name varchar(255) not null,
    password_hash varchar(255),
    google_sub varchar(255) unique,
    email_verified_at timestamp with time zone,
    deactivated_at timestamp with time zone,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create index idx_identity_users_email on identity_users (email);

create table organization_memberships (
    id uuid primary key,
    identity_user_id uuid not null references identity_users (id) on delete cascade,
    organization_id uuid not null references organizations (id) on delete cascade,
    legacy_user_id uuid unique references users (id) on delete set null,
    role varchar(32) not null,
    status varchar(32) not null,
    is_managed_member boolean not null default false,
    joined_at timestamp with time zone not null,
    deactivated_at timestamp with time zone,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    constraint uq_organization_memberships_identity_org unique (identity_user_id, organization_id)
);

create index idx_organization_memberships_identity_user_id
    on organization_memberships (identity_user_id);

create index idx_organization_memberships_organization_id
    on organization_memberships (organization_id);

insert into identity_users (
    id,
    legacy_user_id,
    email,
    name,
    password_hash,
    google_sub,
    email_verified_at,
    deactivated_at,
    created_at,
    updated_at
)
select
    u.id,
    u.id,
    u.email,
    u.name,
    u.password_hash,
    u.google_sub,
    u.email_verified_at,
    u.deactivated_at,
    u.created_at,
    u.updated_at
from users u
on conflict (email) do nothing;

insert into organization_memberships (
    id,
    identity_user_id,
    organization_id,
    legacy_user_id,
    role,
    status,
    is_managed_member,
    joined_at,
    deactivated_at,
    created_at,
    updated_at
)
select
    u.id,
    iu.id,
    u.org_id,
    u.id,
    u.role,
    case
        when u.deactivated_at is null then 'ACTIVE'
        else 'REMOVED'
    end,
    false,
    u.created_at,
    u.deactivated_at,
    u.created_at,
    u.updated_at
from users u
join identity_users iu on iu.email = u.email
on conflict (identity_user_id, organization_id) do nothing;

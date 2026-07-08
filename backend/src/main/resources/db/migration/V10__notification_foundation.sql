create table notification_records (
    id uuid primary key,
    org_id uuid references organizations (id) on delete set null,
    user_id uuid references users (id) on delete set null,
    type varchar(64) not null,
    title varchar(255) not null,
    message varchar(1000) not null,
    action_url varchar(1024),
    recipient_email varchar(255) not null,
    email_delivery_status varchar(32) not null,
    read_at timestamp with time zone,
    delivered_at timestamp with time zone,
    last_error varchar(1000),
    created_at timestamp with time zone not null
);

create index idx_notification_records_user_created_at
    on notification_records (user_id, created_at desc);

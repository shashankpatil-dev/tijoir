alter table users drop constraint if exists users_email_key;
drop index if exists idx_users_email;
create unique index if not exists uq_users_org_email on users (org_id, lower(email));

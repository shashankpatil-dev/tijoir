alter table public_secret_drops
    add column manage_token_hash varchar(64);

create unique index uq_public_secret_drops_manage_token_hash
    on public_secret_drops(manage_token_hash);

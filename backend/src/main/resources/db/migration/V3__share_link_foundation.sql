ALTER TABLE audit_events
    ALTER COLUMN actor_user_id DROP NOT NULL;

CREATE TABLE share_links (
    id UUID PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id),
    secret_id UUID NOT NULL REFERENCES secrets(id),
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    recipient_label VARCHAR(255),
    token_hash VARCHAR(64) NOT NULL,
    contract_permission VARCHAR(64) NOT NULL,
    status VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP,
    consumed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_share_links_token_hash UNIQUE (token_hash)
);

CREATE INDEX idx_share_links_org_id_created_at ON share_links(org_id, created_at DESC);
CREATE INDEX idx_share_links_secret_id ON share_links(secret_id);

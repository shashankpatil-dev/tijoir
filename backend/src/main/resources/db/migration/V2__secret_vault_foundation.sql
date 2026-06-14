CREATE TABLE audit_events (
    id UUID PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id),
    actor_user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID NOT NULL,
    details_json TEXT,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_audit_events_org_id_created_at ON audit_events(org_id, created_at DESC);

CREATE TABLE secrets (
    id UUID PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id),
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    secret_key VARCHAR(255) NOT NULL,
    secret_type VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    current_version_number INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_secrets_org_key UNIQUE (org_id, secret_key)
);

CREATE INDEX idx_secrets_org_id_created_at ON secrets(org_id, created_at DESC);

CREATE TABLE secret_versions (
    id UUID PRIMARY KEY,
    secret_id UUID NOT NULL REFERENCES secrets(id),
    version_number INTEGER NOT NULL,
    storage_backend VARCHAR(100) NOT NULL,
    payload_ref VARCHAR(512),
    payload_ciphertext TEXT,
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_secret_versions_secret_version UNIQUE (secret_id, version_number)
);

CREATE INDEX idx_secret_versions_secret_id ON secret_versions(secret_id);

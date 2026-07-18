CREATE TABLE vendor_contract_secret_grants (
    id UUID PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id),
    contract_id UUID NOT NULL REFERENCES vendor_access_contracts(id),
    secret_id UUID NOT NULL REFERENCES secrets(id),
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    grant_permission VARCHAR(64) NOT NULL,
    status VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_vendor_contract_secret_grants_contract_id_created_at
    ON vendor_contract_secret_grants(contract_id, created_at DESC);
CREATE INDEX idx_vendor_contract_secret_grants_org_id_status_created_at
    ON vendor_contract_secret_grants(org_id, status, created_at DESC);
CREATE INDEX idx_vendor_contract_secret_grants_secret_id
    ON vendor_contract_secret_grants(secret_id);

INSERT INTO vendor_contract_secret_grants (
    id,
    org_id,
    contract_id,
    secret_id,
    created_by_user_id,
    grant_permission,
    status,
    expires_at,
    revoked_at,
    created_at,
    updated_at
)
SELECT
    id,
    org_id,
    id,
    secret_id,
    created_by_user_id,
    contract_permission,
    status,
    expires_at,
    revoked_at,
    created_at,
    updated_at
FROM vendor_access_contracts;

ALTER TABLE share_links
    ADD COLUMN grant_id UUID REFERENCES vendor_contract_secret_grants(id);

CREATE INDEX idx_share_links_grant_id
    ON share_links(grant_id);

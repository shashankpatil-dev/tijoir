CREATE TABLE vendors (
    id UUID PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id),
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    notes TEXT,
    status VARCHAR(64) NOT NULL,
    offboarded_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_vendors_org_id_created_at ON vendors(org_id, created_at DESC);
CREATE INDEX idx_vendors_org_id_status_created_at ON vendors(org_id, status, created_at DESC);

CREATE TABLE vendor_access_contracts (
    id UUID PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    secret_id UUID NOT NULL REFERENCES secrets(id),
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    contract_permission VARCHAR(64) NOT NULL,
    status VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_vendor_access_contracts_vendor_id_created_at
    ON vendor_access_contracts(vendor_id, created_at DESC);
CREATE INDEX idx_vendor_access_contracts_org_id_status_created_at
    ON vendor_access_contracts(org_id, status, created_at DESC);

ALTER TABLE share_links
    ADD COLUMN vendor_id UUID REFERENCES vendors(id),
    ADD COLUMN contract_id UUID REFERENCES vendor_access_contracts(id);

CREATE INDEX idx_share_links_vendor_id_status_created_at
    ON share_links(vendor_id, status, created_at DESC);
CREATE INDEX idx_share_links_contract_id
    ON share_links(contract_id);

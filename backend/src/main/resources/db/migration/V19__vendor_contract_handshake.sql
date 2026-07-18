ALTER TABLE vendors
    ADD COLUMN linked_org_id UUID REFERENCES organizations(id);

CREATE INDEX idx_vendors_linked_org_id_status_created_at
    ON vendors(linked_org_id, status, created_at DESC);

ALTER TABLE vendor_access_contracts
    ADD COLUMN counterparty_accepted_by_user_id UUID REFERENCES users(id),
    ADD COLUMN counterparty_accepted_at TIMESTAMP;

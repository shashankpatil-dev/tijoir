CREATE TABLE organization_policies (
    id UUID PRIMARY KEY,
    org_id UUID NOT NULL UNIQUE REFERENCES organizations(id),
    default_share_link_expiry_hours INTEGER,
    require_vendor_contract_for_share_links BOOLEAN NOT NULL DEFAULT FALSE,
    allow_view_once BOOLEAN NOT NULL DEFAULT TRUE,
    allow_view_until_revoked BOOLEAN NOT NULL DEFAULT TRUE,
    allow_rotation_notify_only BOOLEAN NOT NULL DEFAULT TRUE,
    rotation_reminder_days INTEGER,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_organization_policies_org_id ON organization_policies(org_id);

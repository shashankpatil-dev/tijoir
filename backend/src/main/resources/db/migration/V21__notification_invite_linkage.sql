ALTER TABLE notification_records
    ADD COLUMN organization_invite_id UUID NULL;

ALTER TABLE notification_records
    ADD CONSTRAINT fk_notification_records_organization_invite
        FOREIGN KEY (organization_invite_id) REFERENCES organization_invites(id) ON DELETE SET NULL;

CREATE INDEX idx_notification_records_invite_created_at
    ON notification_records (organization_invite_id, created_at DESC);

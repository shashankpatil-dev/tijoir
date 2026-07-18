ALTER TABLE vendor_contract_secret_grants
    ADD COLUMN consumed_at TIMESTAMP NULL,
    ADD COLUMN consumed_by_user_id UUID NULL;

ALTER TABLE vendor_contract_secret_grants
    ADD CONSTRAINT fk_vendor_contract_secret_grants_consumed_by_user
        FOREIGN KEY (consumed_by_user_id) REFERENCES users(id);

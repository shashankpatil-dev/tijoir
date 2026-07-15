ALTER TABLE users ADD COLUMN google_sub VARCHAR(255);
ALTER TABLE users ADD CONSTRAINT uq_users_google_sub UNIQUE (google_sub);
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    consumed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

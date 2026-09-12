CREATE TABLE IF NOT EXISTS user_credentials (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at TIMESTAMPTZ,
    scope TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, provider)
);

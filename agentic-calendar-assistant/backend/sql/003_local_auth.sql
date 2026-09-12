ALTER TABLE users
    ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
    ON users (lower(email))
    WHERE email IS NOT NULL;

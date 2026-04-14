-- Pokreni kao pandora_app na bazi pandora:
--   "Z:\postgresql\bin\psql.exe" -U pandora_app -d pandora -f db/schema.sql

CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    ime           TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));

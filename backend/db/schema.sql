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

CREATE TABLE IF NOT EXISTS alarms (
    id         BIGSERIAL PRIMARY KEY,
    type       TEXT        NOT NULL CHECK (type IN ('motion', 'sound', 'offline', 'door', 'temp')),
    camera     TEXT        NOT NULL,
    message    TEXT        NOT NULL,
    time       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_read    BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS alarms_time_idx   ON alarms (time DESC);
CREATE INDEX IF NOT EXISTS alarms_isread_idx ON alarms (is_read);

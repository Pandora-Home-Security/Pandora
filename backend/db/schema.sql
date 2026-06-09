-- Pokreni kao pandora_app na bazi pandora:
--   "Z:\postgresql\bin\psql.exe" -U pandora_app -d pandora -f db/schema.sql

CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    ime           TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'korisnik' CHECK (role IN ('admin', 'korisnik')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migracija: dodaj role stupac ako ne postoji (za postojeće baze)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'korisnik' CHECK (role IN ('admin', 'korisnik'));
  END IF;
END $$;

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

/* ===== IoT uređaji (senzori) ===== */

CREATE TABLE IF NOT EXISTS devices (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT        NOT NULL,
    type        TEXT        NOT NULL CHECK (type IN ('door', 'window', 'smoke', 'temperature', 'motion')),
    location    TEXT        NOT NULL,
    api_key     TEXT        NOT NULL UNIQUE,
    status      TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    last_seen   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS devices_api_key_idx ON devices (api_key);
CREATE INDEX IF NOT EXISTS devices_status_idx  ON devices (status);

/* ===== Događaji sa senzora ===== */

CREATE TABLE IF NOT EXISTS device_events (
    id          BIGSERIAL PRIMARY KEY,
    device_id   BIGINT      NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    event_type  TEXT        NOT NULL CHECK (event_type IN ('reading', 'alert', 'status_change', 'battery_low', 'offline', 'online')),
    payload     JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS device_events_device_idx ON device_events (device_id);
CREATE INDEX IF NOT EXISTS device_events_time_idx   ON device_events (created_at DESC);

/* ===== Kamere ===== */

CREATE TABLE IF NOT EXISTS cameras (
    id          BIGSERIAL   PRIMARY KEY,
    name        TEXT        NOT NULL,
    location    TEXT        NOT NULL,
    is_online   BOOLEAN     NOT NULL DEFAULT FALSE,
    resolution  TEXT        NOT NULL DEFAULT '1920x1080',
    last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip          TEXT,
    stream_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cameras_online_idx ON cameras (is_online);

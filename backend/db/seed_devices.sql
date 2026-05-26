-- Testni senzori za razvoj.
-- Pokreni nakon schema.sql:
--   "Z:\postgresql\bin\psql.exe" -U pandora_app -d pandora -f db/seed_devices.sql

INSERT INTO devices (name, type, location, api_key, status, last_seen) VALUES
  ('Senzor ulaznih vrata',     'door',        'Ulaz',           'dev-key-door-001',        'active',   NOW() - INTERVAL '2 minutes'),
  ('Senzor prozora dnevni',    'window',      'Dnevni boravak', 'dev-key-window-001',      'active',   NOW() - INTERVAL '5 minutes'),
  ('Detektor dima kuhinja',    'smoke',       'Kuhinja',        'dev-key-smoke-001',       'active',   NOW() - INTERVAL '10 minutes'),
  ('Termometar spremište',     'temperature', 'Spremište',      'dev-key-temp-001',        'active',   NOW() - INTERVAL '1 minute'),
  ('Senzor garažnih vrata',    'door',        'Garaža',         'dev-key-door-002',        'inactive', NULL),
  ('Senzor pokreta dvorište',  'motion',      'Dvorište',       'dev-key-motion-001',      'inactive', NULL),
  ('Senzor prozora spavaća',   'window',      'Spavaća soba',   'dev-key-window-002',      'active',   NOW() - INTERVAL '3 minutes'),
  ('Detektor dima hodnik',     'smoke',       'Hodnik',         'dev-key-smoke-002',       'active',   NOW() - INTERVAL '8 minutes'),
  ('Termometar dnevni',        'temperature', 'Dnevni boravak', 'dev-key-temp-002',        'active',   NOW() - INTERVAL '30 seconds'),
  ('Senzor pokreta hodnik',    'motion',      'Hodnik',         'dev-key-motion-002',      'active',   NOW() - INTERVAL '15 minutes')
ON CONFLICT DO NOTHING;

-- Testni događaji
INSERT INTO device_events (device_id, event_type, payload) VALUES
  (1, 'reading',       '{"state": "closed"}'),
  (1, 'alert',         '{"state": "open", "duration_sec": 300}'),
  (1, 'reading',       '{"state": "closed"}'),
  (3, 'reading',       '{"smoke_level": 0.02}'),
  (3, 'alert',         '{"smoke_level": 0.85, "message": "Dim detektiran!"}'),
  (4, 'reading',       '{"temperature": 22.4, "humidity": 45}'),
  (4, 'reading',       '{"temperature": 23.1, "humidity": 44}'),
  (4, 'reading',       '{"temperature": 38.5, "humidity": 30}'),
  (4, 'alert',         '{"temperature": 38.5, "message": "Temperatura previsoka"}'),
  (9, 'reading',       '{"temperature": 23.1, "humidity": 48}'),
  (2, 'status_change', '{"old": "active", "new": "inactive"}'),
  (2, 'online',        '{}'),
  (5, 'battery_low',   '{"level": 12}'),
  (5, 'offline',       '{}'),
  (10, 'reading',      '{"motion": false}'),
  (10, 'alert',        '{"motion": true, "confidence": 0.94}');

-- Testni alarmi za razvoj.
-- Pokreni nakon schema.sql:
--   "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U pandora_app -d pandora -f db/seed_alarms.sql
--
-- Umetne podatke samo ako je tablica prazna, pa je sigurno pokrenuti vise puta.

INSERT INTO alarms (type, camera, message, time, is_read)
SELECT v.type, v.camera, v.message, v.time::timestamptz, v.is_read
FROM (VALUES
  ('motion',  'Ulazna vrata',      'Pokret detektiran',             '2026-04-18T10:25:00Z', FALSE),
  ('sound',   'Dnevni boravak',    'Detektiran glasan zvuk',        '2026-04-18T09:40:00Z', FALSE),
  ('offline', 'Garaža',            'Kamera izgubila vezu',          '2026-04-18T08:15:00Z', FALSE),
  ('door',    'Stražnje dvorište', 'Vrata otvorena',                '2026-04-17T22:30:00Z', FALSE),
  ('temp',    'Spremište',         'Temperatura previsoka',         '2026-04-17T18:05:00Z', TRUE),
  ('motion',  'Hodnik - 1. kat',   'Pokret detektiran',             '2026-04-17T14:20:00Z', TRUE),
  ('offline', 'Spremište',         'Kamera izgubila vezu',          '2026-04-17T11:00:00Z', TRUE),
  ('sound',   'Garaža',            'Detektiran glasan zvuk',        '2026-04-16T23:50:00Z', TRUE),
  ('motion',  'Stražnje dvorište', 'Pokret detektiran',             '2026-04-16T19:10:00Z', TRUE),
  ('door',    'Ulazna vrata',      'Vrata otvorena dulje od 5 min', '2026-04-16T07:45:00Z', TRUE)
) AS v(type, camera, message, time, is_read)
WHERE NOT EXISTS (SELECT 1 FROM alarms);

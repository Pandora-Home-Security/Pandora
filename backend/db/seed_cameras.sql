-- Testne kamere za razvoj.
-- Pokreni nakon schema.sql:
--   "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U pandora_app -d pandora -f db/seed_cameras.sql
--
-- Umetne podatke samo ako je tablica prazna, pa je sigurno pokrenuti vise puta.

INSERT INTO cameras (name, location, is_online, resolution, last_seen, ip)
SELECT v.name, v.location, v.is_online, v.resolution, v.last_seen, v.ip
FROM (VALUES
  ('Ulazna vrata',      'Ulaz',      TRUE,  '1920x1080', NOW() - INTERVAL '2 minutes', '192.168.1.101'),
  ('Dnevni boravak',    'Prizemlje', TRUE,  '1920x1080', NOW() - INTERVAL '1 minute',  '192.168.1.102'),
  ('Garaza',            'Garaza',    FALSE, '1280x720',  NOW() - INTERVAL '2 days',     '192.168.1.103'),
  ('Straznje dvoriste', 'Dvoriste',  TRUE,  '1920x1080', NOW() - INTERVAL '3 minutes', '192.168.1.104'),
  ('Spremiste',         'Prizemlje', FALSE, '1280x720',  NOW() - INTERVAL '3 days',     '192.168.1.105'),
  ('Hodnik - 1. kat',   '1. kat',    TRUE,  '1920x1080', NOW() - INTERVAL '1 minute',  '192.168.1.106')
) AS v(name, location, is_online, resolution, last_seen, ip)
WHERE NOT EXISTS (SELECT 1 FROM cameras);

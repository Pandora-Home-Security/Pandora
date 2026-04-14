-- Pokreni JEDNOM kao postgres superuser:
--   "Z:\postgresql\bin\psql.exe" -U postgres -f db/init.sql
--
-- Kreira app usera i bazu za lokalni development.
-- Lozinka je hardkodirana za dev (baza slusa samo na localhost).

CREATE USER pandora_app WITH PASSWORD 'pandora_dev';
CREATE DATABASE pandora OWNER pandora_app;

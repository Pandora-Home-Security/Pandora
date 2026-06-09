import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import http from 'http';
import https from 'https';
import { Pool } from 'pg';
import type { NextFunction, Request, Response } from 'express';
import { signToken, verifyToken } from './lib/token';
import type { AuthTokenPayload, UserRole } from './lib/token';
import { isValidEmail, isValidPassword, isNonEmptyString } from './lib/validation';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const TOKEN_TTL_SECONDS = 60 * 60 * 8;
const IS_TEST = process.env.VITEST === 'true';

if (!process.env.DATABASE_URL && !IS_TEST) {
  console.error('DATABASE_URL nije postavljen. Kopiraj backend/.env.example u backend/.env.');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors());
app.use(express.json());

type StoredUser = {
  id: string;
  ime: string;
  email: string;
  password_hash: string;
  role: UserRole;
};

type AuthenticatedRequest = Request & {
  user?: AuthTokenPayload;
};

const createAuthToken = (user: StoredUser) =>
  signToken({
    sub: user.id,
    email: user.email,
    ime: user.ime,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  });

const sanitizeUser = (user: StoredUser) => ({
  id: user.id,
  ime: user.ime,
  email: user.email,
  role: user.role,
});

const findUserByEmail = async (email: string): Promise<StoredUser | null> => {
  const result = await pool.query<StoredUser>(
    'SELECT id::text AS id, ime, email, password_hash, role FROM users WHERE LOWER(email) = LOWER($1)',
    [email],
  );
  return result.rows[0] ?? null;
};

const authenticateRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Nedostaje Authorization token.' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: 'Nevazeci ili istekli token.' });
  }

  const user = await findUserByEmail(payload.email);
  if (!user || user.id !== payload.sub) {
    return res.status(401).json({ message: 'Korisnik vise nije prijavljen.' });
  }

  req.user = payload;
  next();
};

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend radi' });
});

/* ===== Autentikacija IoT uređaja (Bearer DEVICE_API_KEY) ===== */

type DeviceRow = {
  id: string;
  name: string;
  type: string;
  location: string;
  api_key: string;
  status: string;
  last_seen: string | null;
  created_at: string;
};

type DeviceAuthenticatedRequest = Request & {
  device?: DeviceRow;
};

const authenticateDevice = async (
  req: DeviceAuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Nedostaje Authorization token.' });
  }

  const apiKey = authHeader.slice('Bearer '.length).trim();
  if (!apiKey) {
    return res.status(401).json({ message: 'Prazan API ključ.' });
  }

  const result = await pool.query<DeviceRow>(
    `SELECT id::text AS id, name, type, location, api_key, status,
            last_seen::text, created_at::text
     FROM devices WHERE api_key = $1`,
    [apiKey],
  );

  const device = result.rows[0];
  if (!device) {
    return res.status(401).json({ message: 'Nepoznat uređaj.' });
  }

  if (device.status !== 'active') {
    return res.status(403).json({ message: 'Uređaj je deaktiviran.' });
  }

  req.device = device;
  next();
};

/* ===== POST /api/device-events — prijem događaja sa senzora ===== */

const VALID_EVENT_TYPES = ['reading', 'alert', 'status_change', 'battery_low', 'offline', 'online'] as const;

app.post('/api/device-events', authenticateDevice, async (req: DeviceAuthenticatedRequest, res) => {
  const { event_type, payload } = req.body ?? {};

  if (!event_type || typeof event_type !== 'string' || !VALID_EVENT_TYPES.includes(event_type as typeof VALID_EVENT_TYPES[number])) {
    return res.status(400).json({
      message: `event_type je obavezan i mora biti jedan od: ${VALID_EVENT_TYPES.join(', ')}`,
    });
  }

  if (payload !== undefined && (typeof payload !== 'object' || payload === null || Array.isArray(payload))) {
    return res.status(400).json({ message: 'payload mora biti objekt.' });
  }

  const eventResult = await pool.query(
    `INSERT INTO device_events (device_id, event_type, payload)
     VALUES ($1, $2, $3)
     RETURNING id::text AS id, device_id::text AS device_id, event_type, payload, created_at`,
    [req.device!.id, event_type, JSON.stringify(payload ?? {})],
  );

  await pool.query(
    'UPDATE devices SET last_seen = NOW() WHERE id = $1',
    [req.device!.id],
  );

  res.status(201).json({ event: eventResult.rows[0] });
});

/* ===== API za web aplikaciju — upravljanje senzorima ===== */

app.get('/api/sensors', authenticateRequest, async (_req: AuthenticatedRequest, res) => {
  const result = await pool.query(
    `SELECT d.id::text AS id, d.name, d.type, d.location, d.status,
            d.last_seen, d.created_at,
            le.event_type  AS last_event_type,
            le.payload     AS last_event_payload,
            le.created_at  AS last_event_time
     FROM devices d
     LEFT JOIN LATERAL (
       SELECT event_type, payload, created_at
       FROM device_events
       WHERE device_id = d.id
       ORDER BY created_at DESC
       LIMIT 1
     ) le ON true
     ORDER BY d.created_at DESC`,
  );
  res.json({ sensors: result.rows });
});

app.get('/api/sensors/:id', authenticateRequest, async (req: AuthenticatedRequest, res) => {
  const result = await pool.query(
    `SELECT id::text AS id, name, type, location, status,
            last_seen, created_at
     FROM devices WHERE id = $1`,
    [req.params.id],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Senzor nije pronađen.' });
  }

  res.json({ sensor: result.rows[0] });
});

app.get('/api/sensors/:id/events', authenticateRequest, async (req: AuthenticatedRequest, res) => {
  const deviceCheck = await pool.query('SELECT id FROM devices WHERE id = $1', [req.params.id]);
  if (deviceCheck.rows.length === 0) {
    return res.status(404).json({ message: 'Senzor nije pronađen.' });
  }

  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const result = await pool.query(
    `SELECT id::text AS id, device_id::text AS device_id, event_type, payload, created_at
     FROM device_events
     WHERE device_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.params.id, limit, offset],
  );

  res.json({ events: result.rows });
});

app.post('/api/sensors', authenticateRequest, async (_req: AuthenticatedRequest, res) => {
  const { name, type, location } = _req.body ?? {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Naziv senzora je obavezan.' });
  }

  const validTypes = ['door', 'window', 'smoke', 'temperature', 'motion'];
  if (!type || !validTypes.includes(type)) {
    return res.status(400).json({ message: `Tip mora biti jedan od: ${validTypes.join(', ')}` });
  }

  if (!location || typeof location !== 'string' || !location.trim()) {
    return res.status(400).json({ message: 'Lokacija je obavezna.' });
  }

  const apiKey = crypto.randomBytes(32).toString('hex');

  const result = await pool.query(
    `INSERT INTO devices (name, type, location, api_key)
     VALUES ($1, $2, $3, $4)
     RETURNING id::text AS id, name, type, location, api_key, status, last_seen, created_at`,
    [name.trim(), type, location.trim(), apiKey],
  );

  res.status(201).json({ message: 'Senzor uspješno dodan.', sensor: result.rows[0] });
});

app.put('/api/sensors/:id', authenticateRequest, async (req: AuthenticatedRequest, res) => {
  const { name, type, location, status } = req.body ?? {};

  const existing = await pool.query('SELECT id FROM devices WHERE id = $1', [req.params.id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ message: 'Senzor nije pronađen.' });
  }

  const updates: string[] = [];
  const values: (string | number)[] = [];
  let paramIndex = 1;

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Naziv ne može biti prazan.' });
    }
    updates.push(`name = $${paramIndex++}`);
    values.push(name.trim());
  }

  if (type !== undefined) {
    const validTypes = ['door', 'window', 'smoke', 'temperature', 'motion'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: `Tip mora biti jedan od: ${validTypes.join(', ')}` });
    }
    updates.push(`type = $${paramIndex++}`);
    values.push(type);
  }

  if (location !== undefined) {
    if (typeof location !== 'string' || !location.trim()) {
      return res.status(400).json({ message: 'Lokacija ne može biti prazna.' });
    }
    updates.push(`location = $${paramIndex++}`);
    values.push(location.trim());
  }

  if (status !== undefined) {
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Status mora biti active ili inactive.' });
    }
    updates.push(`status = $${paramIndex++}`);
    values.push(status);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'Nema polja za ažuriranje.' });
  }

  values.push(req.params.id);
  const result = await pool.query(
    `UPDATE devices SET ${updates.join(', ')} WHERE id = $${paramIndex}
     RETURNING id::text AS id, name, type, location, status, last_seen, created_at`,
    values,
  );

  res.json({ message: 'Senzor uspješno ažuriran.', sensor: result.rows[0] });
});

app.delete('/api/sensors/:id', authenticateRequest, async (req: AuthenticatedRequest, res) => {
  const result = await pool.query('DELETE FROM devices WHERE id = $1 RETURNING id', [req.params.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Senzor nije pronađen.' });
  }
  res.json({ message: 'Senzor uspješno obrisan.' });
});

/* ===== Admin middleware ===== */

const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Samo administratori imaju pristup.' });
  }
  next();
};

/* ===== Admin CRUD korisnici ===== */

app.get('/api/users', authenticateRequest, requireAdmin, async (_req: AuthenticatedRequest, res) => {
  const result = await pool.query(
    `SELECT id::text AS id, ime, email, role, created_at
     FROM users ORDER BY created_at DESC`,
  );
  res.json({ users: result.rows });
});

app.post('/api/users/invite', authenticateRequest, requireAdmin, async (req: AuthenticatedRequest, res) => {
  const { ime, email, password, role } = req.body ?? {};

  if (!isNonEmptyString(ime)) {
    return res.status(400).json({ message: 'Ime je obavezno.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Neispravna email adresa.' });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({ message: 'Lozinka mora imati najmanje 8 znakova.' });
  }

  const userRole: UserRole = role === 'admin' ? 'admin' : 'korisnik';
  const existing = await findUserByEmail(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'Korisnik s tim emailom već postoji.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (ime, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id::text AS id, ime, email, role, created_at`,
    [ime.trim(), email.toLowerCase(), passwordHash, userRole],
  );

  res.status(201).json({ message: 'Korisnik uspješno dodan.', user: result.rows[0] });
});

app.put('/api/users/:id/role', authenticateRequest, requireAdmin, async (req: AuthenticatedRequest, res) => {
  const { role } = req.body ?? {};
  if (!role || !['admin', 'korisnik'].includes(role)) {
    return res.status(400).json({ message: 'Uloga mora biti admin ili korisnik.' });
  }
  if (req.params.id === req.user!.sub) {
    return res.status(400).json({ message: 'Ne možete promijeniti vlastitu ulogu.' });
  }

  const result = await pool.query(
    `UPDATE users SET role = $1 WHERE id = $2
     RETURNING id::text AS id, ime, email, role, created_at`,
    [role, req.params.id],
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Korisnik nije pronađen.' });
  }
  res.json({ message: 'Uloga uspješno promijenjena.', user: result.rows[0] });
});

app.delete('/api/users/:id', authenticateRequest, requireAdmin, async (req: AuthenticatedRequest, res) => {
  if (req.params.id === req.user!.sub) {
    return res.status(400).json({ message: 'Ne možete obrisati vlastiti račun.' });
  }
  const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Korisnik nije pronađen.' });
  }
  res.json({ message: 'Korisnik uspješno obrisan.' });
});

app.post('/api/auth/register', async (req, res) => {
  const { ime, email, password } = req.body ?? {};

  if (!isNonEmptyString(ime)) {
    return res.status(400).json({ message: 'Ime je obavezno.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Neispravna email adresa.' });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({ message: 'Lozinka mora imati najmanje 8 znakova.' });
  }

  const emailKey = email.toLowerCase();

  const existing = await findUserByEmail(emailKey);
  if (existing) {
    return res.status(409).json({ message: 'Korisnik s tim emailom vec postoji.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool.query<StoredUser>(
    `INSERT INTO users (ime, email, password_hash, role)
     VALUES ($1, $2, $3, 'korisnik')
     RETURNING id::text AS id, ime, email, password_hash, role`,
    [ime.trim(), emailKey, passwordHash],
  );

  const user = result.rows[0];

  return res.status(201).json({
    message: 'Racun uspjesno stvoren.',
    user: sanitizeUser(user),
    token: createAuthToken(user),
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({ message: 'Email i lozinka su obavezni.' });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ message: 'Pogresan email ili lozinka.' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Pogresan email ili lozinka.' });
  }

  return res.json({
    message: 'Prijava uspjesna.',
    token: createAuthToken(user),
    user: sanitizeUser(user),
  });
});

/* ===== Upravljanje računom ===== */

app.put('/api/auth/profile', authenticateRequest, async (req: AuthenticatedRequest, res) => {
  const { ime, email } = req.body ?? {};

  if (!isNonEmptyString(ime)) {
    return res.status(400).json({ message: 'Ime je obavezno.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Neispravna email adresa.' });
  }

  const emailKey = email.toLowerCase();

  const existing = await findUserByEmail(emailKey);
  if (existing && existing.id !== req.user!.sub) {
    return res.status(409).json({ message: 'Email adresa je već u upotrebi.' });
  }

  const result = await pool.query<StoredUser>(
    `UPDATE users SET ime = $1, email = $2 WHERE id = $3
     RETURNING id::text AS id, ime, email, password_hash, role`,
    [ime.trim(), emailKey, req.user!.sub],
  );

  const user = result.rows[0];
  return res.json({
    message: 'Profil uspješno ažuriran.',
    user: sanitizeUser(user),
    token: createAuthToken(user),
  });
});

app.put('/api/auth/password', authenticateRequest, async (req: AuthenticatedRequest, res) => {
  const { staraLozinka, novaLozinka } = req.body ?? {};

  if (!staraLozinka || typeof staraLozinka !== 'string') {
    return res.status(400).json({ message: 'Stara lozinka je obavezna.' });
  }

  if (!novaLozinka || typeof novaLozinka !== 'string' || novaLozinka.length < 8) {
    return res.status(400).json({ message: 'Nova lozinka mora imati najmanje 8 znakova.' });
  }

  const result = await pool.query<StoredUser>(
    'SELECT id::text AS id, ime, email, password_hash, role FROM users WHERE id = $1',
    [req.user!.sub],
  );

  const user = result.rows[0];
  if (!user) {
    return res.status(404).json({ message: 'Korisnik nije pronađen.' });
  }

  const isValid = await bcrypt.compare(staraLozinka, user.password_hash);
  if (!isValid) {
    return res.status(400).json({ message: 'Stara lozinka nije ispravna.' });
  }

  const newHash = await bcrypt.hash(novaLozinka, 10);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user!.sub]);

  return res.json({ message: 'Lozinka uspješno promijenjena.' });
});

/* ===== Alarmi (baza) ===== */
type AlarmType = 'motion' | 'sound' | 'offline' | 'door' | 'temp';
const VALID_ALARM_TYPES: AlarmType[] = ['motion', 'sound', 'offline', 'door', 'temp'];

// Stupci u obliku koji frontend očekuje (id kao string, is_read -> isRead)
const ALARM_SELECT = `id::text AS id, type, camera, message, time, is_read AS "isRead"`;

app.get('/api/alarms', authenticateRequest, async (_req: AuthenticatedRequest, res) => {
  const result = await pool.query(`SELECT ${ALARM_SELECT} FROM alarms ORDER BY time DESC`);
  res.json({ alarms: result.rows });
});

app.patch('/api/alarms/read-all', authenticateRequest, async (_req: AuthenticatedRequest, res) => {
  await pool.query('UPDATE alarms SET is_read = TRUE WHERE is_read = FALSE');
  res.json({ message: 'Svi alarmi označeni kao pročitani.' });
});

app.patch('/api/alarms/:id/read', authenticateRequest, async (req: AuthenticatedRequest, res) => {
  const result = await pool.query(
    `UPDATE alarms SET is_read = TRUE WHERE id = $1 RETURNING ${ALARM_SELECT}`,
    [req.params.id],
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Alarm nije pronađen.' });
  }
  res.json({ alarm: result.rows[0] });
});

/* ===== Simulacija novih alarma (za testiranje real-time notifikacija) ===== */
const simulationPool: { type: AlarmType; camera: string; message: string }[] = [
  { type: 'motion',  camera: 'Ulazna vrata',      message: 'Pokret detektiran' },
  { type: 'sound',   camera: 'Dnevni boravak',    message: 'Detektiran glasan zvuk' },
  { type: 'offline', camera: 'Garaža',            message: 'Kamera izgubila vezu' },
  { type: 'door',    camera: 'Stražnje dvorište', message: 'Vrata otvorena' },
  { type: 'temp',    camera: 'Spremište',         message: 'Temperatura previsoka' },
  { type: 'motion',  camera: 'Hodnik - 1. kat',   message: 'Pokret detektiran' },
];

app.post('/api/alarms/simulate', authenticateRequest, async (req: AuthenticatedRequest, res) => {
  const body = req.body ?? {};
  const pick = simulationPool[Math.floor(Math.random() * simulationPool.length)];

  const type: AlarmType = body.type && VALID_ALARM_TYPES.includes(body.type) ? body.type : pick.type;
  const camera = typeof body.camera === 'string' && body.camera.trim() ? body.camera.trim() : pick.camera;
  const message = typeof body.message === 'string' && body.message.trim() ? body.message.trim() : pick.message;

  // Vrijeme i id postavlja baza (DEFAULT NOW(), BIGSERIAL)
  const result = await pool.query(
    `INSERT INTO alarms (type, camera, message) VALUES ($1, $2, $3) RETURNING ${ALARM_SELECT}`,
    [type, camera, message],
  );
  res.status(201).json({ alarm: result.rows[0] });
});

/* ===== Kamere (baza) ===== */
// Stupci u obliku koji frontend očekuje (id kao string, snake_case -> camelCase)
const CAMERA_SELECT =
  `id::text AS id, name, location, is_online AS "isOnline", resolution, last_seen AS "lastSeen", ip, stream_url AS "streamUrl"`;

app.get('/api/cameras', authenticateRequest, async (req: AuthenticatedRequest, res) => {
  const result = await pool.query(`SELECT ${CAMERA_SELECT} FROM cameras ORDER BY id`);
  res.json({
    user: req.user,
    cameras: result.rows,
  });
});

app.get('/api/cameras/:id', authenticateRequest, async (req: AuthenticatedRequest, res) => {
  const result = await pool.query(`SELECT ${CAMERA_SELECT} FROM cameras WHERE id = $1`, [req.params.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Kamera nije pronadena.' });
  }
  res.json({ camera: result.rows[0] });
});

/* ===== Proxy za live MJPEG stream =====
   Preglednik ne može slati Basic Auth ni JWT kroz <img>, pa stream provlačimo kroz
   backend: on se (po potrebi) prijavi na izvor — podaci se čitaju iz stream URL-a,
   npr. http://admin:admin@192.168.0.13:8081/video — i prosljeđuje sliku pregledniku.
   Token korisnika dolazi kao query param jer <img> ne može slati Authorization header. */
app.get('/api/cameras/:id/stream', async (req: Request, res: Response) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!verifyToken(token)) {
    return res.status(401).end();
  }

  const result = await pool.query<{ stream_url: string | null }>(
    'SELECT stream_url FROM cameras WHERE id = $1',
    [req.params.id],
  );
  const streamUrl = result.rows[0]?.stream_url;
  if (!streamUrl) {
    return res.status(404).end();
  }

  let target: URL;
  try {
    target = new URL(streamUrl);
  } catch {
    return res.status(400).end();
  }

  // Korisničko ime/lozinku iz URL-a šaljemo kao Basic Auth prema izvoru streama
  const headers: Record<string, string> = {};
  if (target.username || target.password) {
    const creds = `${decodeURIComponent(target.username)}:${decodeURIComponent(target.password)}`;
    headers.Authorization = `Basic ${Buffer.from(creds).toString('base64')}`;
    target.username = '';
    target.password = '';
  }

  const client = target.protocol === 'https:' ? https : http;
  const upstream = client.get(target.toString(), { headers }, (up) => {
    if (up.statusCode !== 200) {
      res.status(up.statusCode ?? 502).end();
      up.resume(); // isprazni odgovor da se veza uredno zatvori
      return;
    }
    res.setHeader('Content-Type', up.headers['content-type'] ?? 'multipart/x-mixed-replace');
    res.setHeader('Cache-Control', 'no-store');
    up.pipe(res);
  });

  upstream.on('error', () => {
    if (!res.headersSent) res.status(502).end();
  });

  // Kad preglednik prekine vezu (pauza, zatvaranje stranice), zaustavi i dohvat s izvora
  req.on('close', () => upstream.destroy());
});

/* ===== CRUD kamere ===== */

app.post('/api/cameras', authenticateRequest, async (req: AuthenticatedRequest, res) => {
  const { name, location, streamUrl } = req.body ?? {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Naziv kamere je obavezan.' });
  }

  if (!location || typeof location !== 'string' || !location.trim()) {
    return res.status(400).json({ message: 'Lokacija je obavezna.' });
  }

  const stream = typeof streamUrl === 'string' && streamUrl.trim() ? streamUrl.trim() : null;

  const result = await pool.query(
    `INSERT INTO cameras (name, location, stream_url)
     VALUES ($1, $2, $3)
     RETURNING ${CAMERA_SELECT}`,
    [name.trim(), location.trim(), stream],
  );

  res.status(201).json({ message: 'Kamera uspjesno dodana.', camera: result.rows[0] });
});

app.put('/api/cameras/:id', authenticateRequest, async (req: AuthenticatedRequest, res) => {
  const existing = await pool.query('SELECT id FROM cameras WHERE id = $1', [req.params.id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ message: 'Kamera nije pronadena.' });
  }

  const { name, location, streamUrl } = req.body ?? {};
  const updates: string[] = [];
  const values: (string | null)[] = [];
  let paramIndex = 1;

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Naziv kamere ne moze biti prazan.' });
    }
    updates.push(`name = $${paramIndex++}`);
    values.push(name.trim());
  }

  if (location !== undefined) {
    if (typeof location !== 'string' || !location.trim()) {
      return res.status(400).json({ message: 'Lokacija ne moze biti prazna.' });
    }
    updates.push(`location = $${paramIndex++}`);
    values.push(location.trim());
  }

  if (streamUrl !== undefined) {
    updates.push(`stream_url = $${paramIndex++}`);
    values.push(typeof streamUrl === 'string' && streamUrl.trim() ? streamUrl.trim() : null);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'Nema polja za ažuriranje.' });
  }

  values.push(req.params.id);
  const result = await pool.query(
    `UPDATE cameras SET ${updates.join(', ')} WHERE id = $${paramIndex}
     RETURNING ${CAMERA_SELECT}`,
    values,
  );

  res.json({ message: 'Kamera uspjesno azurirana.', camera: result.rows[0] });
});

app.delete('/api/cameras/:id', authenticateRequest, async (req: AuthenticatedRequest, res) => {
  const result = await pool.query('DELETE FROM cameras WHERE id = $1 RETURNING id', [req.params.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Kamera nije pronadena.' });
  }
  res.json({ message: 'Kamera uspjesno obrisana.' });
});

// Server se pokreće samo u normalnom radu; pod testovima (Vitest) izvozimo app bez slušanja.
if (!IS_TEST) {
  app.listen(PORT, async () => {
    try {
      await pool.query('SELECT 1');
      console.log(`Backend pokrenut: http://localhost:${PORT} (DB OK)`);
    } catch (err) {
      console.error('Backend pokrenut ali DB konekcija ne radi:', err);
    }
  });
}

export { app };

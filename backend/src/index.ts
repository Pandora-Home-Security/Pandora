import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Pool } from 'pg';
import type { NextFunction, Request, Response } from 'express';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const JWT_SECRET = process.env.JWT_SECRET ?? 'pandora-dev-secret';
const TOKEN_TTL_SECONDS = 60 * 60 * 8;

if (!process.env.DATABASE_URL) {
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
};

type AuthTokenPayload = {
  sub: string;
  email: string;
  ime: string;
  exp: number;
};

type AuthenticatedRequest = Request & {
  user?: AuthTokenPayload;
};

const base64UrlEncode = (value: string) => Buffer.from(value).toString('base64url');

const createSignature = (value: string) =>
  crypto.createHmac('sha256', JWT_SECRET).update(value).digest('base64url');

const signToken = (payload: AuthTokenPayload) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createSignature(`${encodedHeader}.${encodedPayload}`);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

const verifyToken = (token: string): AuthTokenPayload | null => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, receivedSignature] = parts;
  const expectedSignature = createSignature(`${encodedHeader}.${encodedPayload}`);
  if (receivedSignature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf-8'),
    ) as AuthTokenPayload;

    if (!payload.sub || !payload.email || !payload.ime || !payload.exp) {
      return null;
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};

const createAuthToken = (user: StoredUser) =>
  signToken({
    sub: user.id,
    email: user.email,
    ime: user.ime,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  });

const sanitizeUser = (user: StoredUser) => ({
  id: user.id,
  ime: user.ime,
  email: user.email,
});

const findUserByEmail = async (email: string): Promise<StoredUser | null> => {
  const result = await pool.query<StoredUser>(
    'SELECT id::text AS id, ime, email, password_hash FROM users WHERE LOWER(email) = LOWER($1)',
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

app.post('/api/auth/register', async (req, res) => {
  const { ime, email, password } = req.body ?? {};

  if (!ime || typeof ime !== 'string' || !ime.trim()) {
    return res.status(400).json({ message: 'Ime je obavezno.' });
  }

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Neispravna email adresa.' });
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ message: 'Lozinka mora imati najmanje 8 znakova.' });
  }

  const emailKey = email.toLowerCase();

  const existing = await findUserByEmail(emailKey);
  if (existing) {
    return res.status(409).json({ message: 'Korisnik s tim emailom vec postoji.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool.query<StoredUser>(
    `INSERT INTO users (ime, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id::text AS id, ime, email, password_hash`,
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

  if (!ime || typeof ime !== 'string' || !ime.trim()) {
    return res.status(400).json({ message: 'Ime je obavezno.' });
  }

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Neispravna email adresa.' });
  }

  const emailKey = email.toLowerCase();

  const existing = await findUserByEmail(emailKey);
  if (existing && existing.id !== req.user!.sub) {
    return res.status(409).json({ message: 'Email adresa je već u upotrebi.' });
  }

  const result = await pool.query<StoredUser>(
    `UPDATE users SET ime = $1, email = $2 WHERE id = $3
     RETURNING id::text AS id, ime, email, password_hash`,
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
    'SELECT id::text AS id, ime, email, password_hash FROM users WHERE id = $1',
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

/* ===== Mock kamere ===== */
type MockCamera = {
  id: string;
  name: string;
  location: string;
  isOnline: boolean;
  resolution: string;
  lastSeen: string;
  ip: string;
};

const mockCameras: MockCamera[] = [
  { id: '1', name: 'Ulazna vrata', location: 'Ulaz', isOnline: true, resolution: '1920x1080', lastSeen: '2026-04-14T10:30:00Z', ip: '192.168.1.101' },
  { id: '2', name: 'Dnevni boravak', location: 'Prizemlje', isOnline: true, resolution: '1920x1080', lastSeen: '2026-04-14T10:30:00Z', ip: '192.168.1.102' },
  { id: '3', name: 'Garaza', location: 'Garaza', isOnline: false, resolution: '1280x720', lastSeen: '2026-04-13T18:45:00Z', ip: '192.168.1.103' },
  { id: '4', name: 'Straznje dvoriste', location: 'Dvoriste', isOnline: true, resolution: '1920x1080', lastSeen: '2026-04-14T10:30:00Z', ip: '192.168.1.104' },
  { id: '5', name: 'Spremiste', location: 'Prizemlje', isOnline: false, resolution: '1280x720', lastSeen: '2026-04-12T09:15:00Z', ip: '192.168.1.105' },
  { id: '6', name: 'Hodnik - 1. kat', location: '1. kat', isOnline: true, resolution: '1920x1080', lastSeen: '2026-04-14T10:30:00Z', ip: '192.168.1.106' },
];

app.get('/api/cameras', authenticateRequest, (req: AuthenticatedRequest, res) => {
  res.json({
    user: req.user,
    cameras: mockCameras,
  });
});

app.get('/api/cameras/:id', authenticateRequest, (req: AuthenticatedRequest, res) => {
  const camera = mockCameras.find((c) => c.id === req.params.id);
  if (!camera) {
    return res.status(404).json({ message: 'Kamera nije pronadena.' });
  }
  res.json({ camera });
});

/* ===== CRUD kamere ===== */

app.post('/api/cameras', authenticateRequest, (req: AuthenticatedRequest, res) => {
  const { name, location, streamUrl } = req.body ?? {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Naziv kamere je obavezan.' });
  }

  if (!location || typeof location !== 'string' || !location.trim()) {
    return res.status(400).json({ message: 'Lokacija je obavezna.' });
  }

  const maxId = mockCameras.reduce((max, c) => Math.max(max, Number(c.id)), 0);
  const newId = String(maxId + 1);

  const newCamera: MockCamera = {
    id: newId,
    name: name.trim(),
    location: location.trim(),
    isOnline: false,
    resolution: '1920x1080',
    lastSeen: new Date().toISOString(),
    ip: `192.168.1.${100 + Number(newId)}`,
    ...(streamUrl && typeof streamUrl === 'string' ? { streamUrl: streamUrl.trim() } : {}),
  };

  mockCameras.push(newCamera);
  res.status(201).json({ message: 'Kamera uspjesno dodana.', camera: newCamera });
});

app.put('/api/cameras/:id', authenticateRequest, (req: AuthenticatedRequest, res) => {
  const index = mockCameras.findIndex((c) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Kamera nije pronadena.' });
  }

  const { name, location, streamUrl } = req.body ?? {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Naziv kamere ne moze biti prazan.' });
    }
    mockCameras[index].name = name.trim();
  }

  if (location !== undefined) {
    if (typeof location !== 'string' || !location.trim()) {
      return res.status(400).json({ message: 'Lokacija ne moze biti prazna.' });
    }
    mockCameras[index].location = location.trim();
  }

  if (streamUrl !== undefined) {
    (mockCameras[index] as MockCamera & { streamUrl?: string }).streamUrl =
      typeof streamUrl === 'string' && streamUrl.trim() ? streamUrl.trim() : undefined;
  }

  res.json({ message: 'Kamera uspjesno azurirana.', camera: mockCameras[index] });
});

app.delete('/api/cameras/:id', authenticateRequest, (req: AuthenticatedRequest, res) => {
  const index = mockCameras.findIndex((c) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Kamera nije pronadena.' });
  }

  mockCameras.splice(index, 1);
  res.json({ message: 'Kamera uspjesno obrisana.' });
});

app.listen(PORT, async () => {
  try {
    await pool.query('SELECT 1');
    console.log(`Backend pokrenut: http://localhost:${PORT} (DB OK)`);
  } catch (err) {
    console.error('Backend pokrenut ali DB konekcija ne radi:', err);
  }
});

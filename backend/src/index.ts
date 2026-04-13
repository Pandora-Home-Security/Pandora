import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

const app = express();
const PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET ?? 'pandora-dev-secret';
const TOKEN_TTL_SECONDS = 60 * 60 * 8;

app.use(cors());
app.use(express.json());

type StoredUser = {
  id: string;
  ime: string;
  email: string;
  passwordHash: string;
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

const users = new Map<string, StoredUser>();

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

const authenticateRequest = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Nedostaje Authorization token.' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: 'Nevazeci ili istekli token.' });
  }

  const user = users.get(payload.email.toLowerCase());
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
  if (users.has(emailKey)) {
    return res.status(409).json({ message: 'Korisnik s tim emailom vec postoji.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user: StoredUser = {
    id: Date.now().toString(),
    ime: ime.trim(),
    email: emailKey,
    passwordHash,
  };
  users.set(emailKey, user);

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

  const emailKey = email.toLowerCase();
  const user = users.get(emailKey);
  if (!user) {
    return res.status(401).json({ message: 'Pogresan email ili lozinka.' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Pogresan email ili lozinka.' });
  }

  return res.json({
    message: 'Prijava uspjesna.',
    token: createAuthToken(user),
    user: sanitizeUser(user),
  });
});

app.get('/api/cameras', authenticateRequest, (req: AuthenticatedRequest, res) => {
  const mockCameras = [
    { id: '1', name: 'Ulazna vrata', location: 'Ulaz', isOnline: true },
    { id: '2', name: 'Dnevni boravak', location: 'Prizemlje', isOnline: true },
    { id: '3', name: 'Garaza', location: 'Garaza', isOnline: false },
  ];

  res.json({
    user: req.user,
    cameras: mockCameras,
  });
});

app.listen(PORT, () => {
  console.log(`Backend pokrenut: http://localhost:${PORT}`);
});

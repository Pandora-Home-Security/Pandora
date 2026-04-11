import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Da vidimo da server radi
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend radi' });
});

// Placeholder: dohvati sve kamere
app.get('/api/cameras', (_req, res) => {
  const mockCameras = [
    { id: '1', name: 'Ulazna vrata', location: 'Ulaz', isOnline: true },
    { id: '2', name: 'Dnevni boravak', location: 'Prizemlje', isOnline: true },
    { id: '3', name: 'Garaža', location: 'Garaža', isOnline: false },
  ];
  res.json(mockCameras);
});//testne kamere, povezanost backenda i frontenda

// Privremena in-memory pohrana korisnika.
// TODO: zamijeniti pravom bazom (SQLite/PostgreSQL) u sljedećem milestone-u.
type StoredUser = {
  id: string;
  ime: string;
  email: string;
  passwordHash: string;
};
const users = new Map<string, StoredUser>();

// Registracija novog korisnika
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
    return res.status(409).json({ message: 'Korisnik s tim emailom već postoji.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user: StoredUser = {
    id: Date.now().toString(),
    ime: ime.trim(),
    email: emailKey,
    passwordHash,
  };
  users.set(emailKey, user);

  return res.status(201).json({ message: 'Račun uspješno stvoren.', userId: user.id });
});

app.listen(PORT, () => {
  console.log(`Backend pokrenut: http://localhost:${PORT}`);
});

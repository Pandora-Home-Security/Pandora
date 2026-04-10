import express from 'express';
import cors from 'cors';

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

app.listen(PORT, () => {
  console.log(`Backend pokrenut: http://localhost:${PORT}`);
});

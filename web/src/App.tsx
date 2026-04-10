import { useEffect, useState } from 'react';

interface Camera {
  id: string;
  name: string;
  location: string;
  isOnline: boolean;
}

function App() {
  const [cameras, setCameras] = useState<Camera[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/cameras')
      .then((res) => res.json())
      .then((data) => setCameras(data))
      .catch((err) => console.error('Greška pri dohvaćanju kamera:', err));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' ,textAlign:'center' }}>
      <h1>Pandora Dashboard</h1>
      <p>Kućni sigurnosni sustav</p>

      <h2>Kamere</h2>
      {cameras.length === 0 ? (
        <p> Backend nije pokrenut na portu 3001</p>
      ) : (
        <ul>
          {cameras.map((cam) => (
            <li style={{ listStyleType: 'none'}} key={cam.id}>
              <strong>{cam.name}</strong> — {cam.location}{' '}
              {cam.isOnline ? '🟢 Online' : '🔴 Offline'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';
import { apiFetch } from '../lib/api';
import { clearAuthToken } from '../lib/auth';

type Camera = {
  id: string;
  name: string;
  location: string;
  isOnline: boolean;
};

function DashboardPage() {
  const navigate = useNavigate();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCameras = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await apiFetch('/api/cameras', {
          includeAuth: true,
        });
        const data = await response.json();

        if (response.status === 401) {
          clearAuthToken();
          navigate('/login', { replace: true });
          return;
        }

        if (!response.ok) {
          setError(data.message || 'Neuspjesno dohvacanje kamera.');
          return;
        }

        setCameras(data.cameras ?? []);
      } catch {
        setError('Greska pri dohvacanju zasticenih podataka.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadCameras();
  }, [navigate]);

  const handleLogout = () => {
    clearAuthToken();
    navigate('/login', { replace: true });
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <svg viewBox="0 0 48 48" fill="none" className="dashboard-shield">
            <path d="M24 4L6 14V24C6 35.1 13.68 45.48 24 48C34.32 45.48 42 35.1 42 24V14L24 4Z"
                  stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3"/>
            <path d="M24 8L10 16V24C10 33.05 16.36 41.38 24 43.86C31.64 41.38 38 33.05 38 24V16L24 8Z"
                  stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
            <path d="M20 30L15 25L13.18 26.82L20 33.64L35 18.64L33.18 16.82L20 30Z"
                  fill="currentColor" opacity="0.9"/>
          </svg>
          <h1>Pandora</h1>
        </div>
        <button type="button" className="logout-btn" onClick={handleLogout}>
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd"/>
            <path fillRule="evenodd" d="M19 10a.75.75 0 00-.22-.53l-3.25-3.25a.75.75 0 10-1.06 1.06l1.97 1.97H8.75a.75.75 0 000 1.5h7.69l-1.97 1.97a.75.75 0 101.06 1.06l3.25-3.25A.75.75 0 0019 10z" clipRule="evenodd"/>
          </svg>
          <span>Odjava</span>
        </button>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-welcome">
          <h2>DobrodoĹˇli u Pandora kontrolnu ploÄŤu</h2>
          <p>Prijava sada koristi backend autentikaciju, a kamera podaci se dohvaÄ‡aju preko zaĹˇtiÄ‡ene API rute s Bearer tokenom.</p>
        </div>

        <div className="dashboard-status">
          {isLoading && <p>UÄŤitavanje kamera...</p>}
          {!isLoading && error && <p className="dashboard-status-error">{error}</p>}
          {!isLoading && !error && (
            <p className="dashboard-status-success">
              UspjeĹˇno povezano sa zaĹˇtiÄ‡enom rutom. DohvaÄ‡eno kamera: <strong>{cameras.length}</strong>
            </p>
          )}
        </div>

        <div className="dashboard-grid">
          {cameras.map((camera) => (
            <div className="dashboard-card" key={camera.id}>
              <div className="card-icon">{camera.isOnline ? 'CAM' : 'OFF'}</div>
              <h3>{camera.name}</h3>
              <p>Lokacija: {camera.location}</p>
              <p>Status: {camera.isOnline ? 'Online' : 'Offline'}</p>
            </div>
          ))}
          <div className="dashboard-card">
            <div className="card-icon">IOT</div>
            <h3>IoT senzori</h3>
            <p>Popis i statusi povezanih senzora.</p>
          </div>
          <div className="dashboard-card">
            <div className="card-icon">ALR</div>
            <h3>Notifikacije</h3>
            <p>Detektirani dogaÄ‘aji i alarmi.</p>
          </div>
          <div className="dashboard-card">
            <div className="card-icon">ANA</div>
            <h3>Analitika</h3>
            <p>Statistika aktivnosti i grafovi.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;

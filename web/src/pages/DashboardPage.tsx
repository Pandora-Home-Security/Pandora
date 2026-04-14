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
          setError(data.message || 'Neuspješno dohvaćanje kamera.');
          return;
        }

        setCameras(data.cameras ?? []);
      } catch {
        setError('Greška pri dohvaćanju zaštićenih podataka.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadCameras();
  }, [navigate]);

  return (
    <>
      <div className="dashboard-welcome">
        <h2>Dobrodošli u Pandora kontrolnu ploču</h2>
        <p>Prijava sada koristi backend autentikaciju, a kamera podaci se dohvaćaju preko zaštićene API rute s Bearer tokenom.</p>
      </div>

      <div className="dashboard-status">
        {isLoading && <p>Učitavanje kamera...</p>}
        {!isLoading && error && <p className="dashboard-status-error">{error}</p>}
        {!isLoading && !error && (
          <p className="dashboard-status-success">
            Uspješno povezano sa zaštićenom rutom. Dohvaćeno kamera: <strong>{cameras.length}</strong>
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
          <p>Detektirani događaji i alarmi.</p>
        </div>
        <div className="dashboard-card">
          <div className="card-icon">ANA</div>
          <h3>Analitika</h3>
          <p>Statistika aktivnosti i grafovi.</p>
        </div>
      </div>
    </>
  );
}

export default DashboardPage;

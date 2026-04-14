import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';
import { apiFetch } from '../lib/api';
import { clearAuthToken } from '../lib/auth';

/* ===== Tipovi ===== */
type Camera = {
  id: string;
  name: string;
  location: string;
  isOnline: boolean;
};

type MockAlarm = {
  id: string;
  message: string;
  time: string;
  type: 'motion' | 'door' | 'temp' | 'connection';
};

type MockSensor = {
  id: string;
  name: string;
  status: 'active' | 'inactive';
};

/* ===== Mock podaci (dok se M4/M5 ne implementiraju) ===== */
const mockAlarms: MockAlarm[] = [
  { id: '1', message: 'Pokret detektiran - Ulazna vrata', time: 'Prije 5 minuta', type: 'motion' },
  { id: '2', message: 'Vrata otvorena - Garaža', time: 'Prije 23 minute', type: 'door' },
  { id: '3', message: 'Temperatura previsoka - Spremište', time: 'Prije 1 sat', type: 'temp' },
  { id: '4', message: 'Pokret detektiran - Dnevni boravak', time: 'Prije 2 sata', type: 'motion' },
  { id: '5', message: 'Gubitak veze - Senzor dvorište', time: 'Prije 3 sata', type: 'connection' },
];

const mockSensors: MockSensor[] = [
  { id: '1', name: 'Vrata - Ulaz', status: 'active' },
  { id: '2', name: 'Prozor - Dnevni boravak', status: 'active' },
  { id: '3', name: 'Temperatura - Spremište', status: 'active' },
  { id: '4', name: 'Dim - Kuhinja', status: 'active' },
  { id: '5', name: 'Vrata - Garaža', status: 'inactive' },
  { id: '6', name: 'Pokret - Dvorište', status: 'inactive' },
];

const alarmTypeIcons: Record<MockAlarm['type'], string> = {
  motion: 'MOT',
  door: 'DOR',
  temp: 'TMP',
  connection: 'CON',
};

/* ===== Komponenta ===== */
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

  const handleLogout = () => {
    clearAuthToken();
    navigate('/login', { replace: true });
  };

  /* Izračunate vrijednosti za stat kartice */
  const activeCameras = cameras.filter((c) => c.isOnline).length;
  const activeSensors = mockSensors.filter((s) => s.status === 'active').length;
  const inactiveSensors = mockSensors.length - activeSensors;
  const unreadAlarms = mockAlarms.length;

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
        {/* Stat kartice */}
        <div className="stat-cards">
          <div className="stat-card">
            <div className="stat-icon stat-icon-cameras">CAM</div>
            <div className="stat-info">
              <span className="stat-value">
                {isLoading ? '...' : `${activeCameras}/${cameras.length}`}
              </span>
              <span className="stat-label">Aktivne kamere</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-sensors">IOT</div>
            <div className="stat-info">
              <span className="stat-value">{activeSensors}/{mockSensors.length}</span>
              <span className="stat-label">Aktivni senzori</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-alarms">ALR</div>
            <div className="stat-info">
              <span className="stat-value">{unreadAlarms}</span>
              <span className="stat-label">Nepročitani alarmi</span>
            </div>
          </div>
        </div>

        {/* Status poruka za API konekciju */}
        {error && (
          <div className="dashboard-status">
            <p className="dashboard-status-error">{error}</p>
          </div>
        )}

        {/* Dva stupca: Alarmi + Senzori */}
        <div className="dashboard-panels">
          {/* Zadnjih 5 alarma */}
          <section className="panel panel-alarms">
            <h3 className="panel-title">Zadnjih 5 alarma</h3>
            <ul className="alarm-list">
              {mockAlarms.map((alarm) => (
                <li key={alarm.id} className="alarm-item">
                  <span className={`alarm-badge alarm-badge-${alarm.type}`}>
                    {alarmTypeIcons[alarm.type]}
                  </span>
                  <div className="alarm-info">
                    <span className="alarm-message">{alarm.message}</span>
                    <span className="alarm-time">{alarm.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Brzi status senzora */}
          <section className="panel panel-sensors">
            <h3 className="panel-title">Status senzora</h3>
            <div className="sensor-summary">
              <span className="sensor-summary-active">Aktivni: {activeSensors}</span>
              <span className="sensor-summary-divider">|</span>
              <span className="sensor-summary-inactive">Neaktivni: {inactiveSensors}</span>
            </div>
            <ul className="sensor-list">
              {mockSensors.map((sensor) => (
                <li key={sensor.id} className="sensor-item">
                  <span className={`sensor-dot ${sensor.status === 'active' ? 'sensor-dot-active' : 'sensor-dot-inactive'}`} />
                  <span className="sensor-name">{sensor.name}</span>
                  <span className={`sensor-status ${sensor.status === 'active' ? 'sensor-status-active' : 'sensor-status-inactive'}`}>
                    {sensor.status === 'active' ? 'Aktivan' : 'Neaktivan'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Grid kamera */}
        <section className="panel-cameras">
          <h3 className="panel-title">Kamere</h3>
          {isLoading && <p className="loading-text">Učitavanje kamera...</p>}
          {!isLoading && !error && (
            <div className="dashboard-grid">
              {cameras.map((camera) => (
                <div className="dashboard-card" key={camera.id}>
                  <div className="card-icon">{camera.isOnline ? 'CAM' : 'OFF'}</div>
                  <h3>{camera.name}</h3>
                  <p>Lokacija: {camera.location}</p>
                  <p>Status: {camera.isOnline ? 'Online' : 'Offline'}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default DashboardPage;

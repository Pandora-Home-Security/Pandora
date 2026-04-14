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

  /* Izračunate vrijednosti za stat kartice */
  const activeCameras = cameras.filter((c) => c.isOnline).length;
  const activeSensors = mockSensors.filter((s) => s.status === 'active').length;
  const inactiveSensors = mockSensors.length - activeSensors;
  const unreadAlarms = mockAlarms.length;

  return (
    <>
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
    </>
  );
}

export default DashboardPage;

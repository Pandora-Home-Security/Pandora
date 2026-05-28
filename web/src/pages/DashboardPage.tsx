import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';
import { apiFetch } from '../lib/api';
import { clearAuthToken } from '../lib/auth';
import { LoadingState, ErrorState, EmptyState } from '../components/DataStates';

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

type Sensor = {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'active' | 'inactive';
  last_seen: string | null;
};

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

function isSensorOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_THRESHOLD_MS;
}

/* ===== Mock alarmi (dok M4 ne koristi pravi API) ===== */
const mockAlarms: MockAlarm[] = [
  { id: '1', message: 'Pokret detektiran - Ulazna vrata', time: 'Prije 5 minuta', type: 'motion' },
  { id: '2', message: 'Vrata otvorena - Garaža', time: 'Prije 23 minute', type: 'door' },
  { id: '3', message: 'Temperatura previsoka - Spremište', time: 'Prije 1 sat', type: 'temp' },
  { id: '4', message: 'Pokret detektiran - Dnevni boravak', time: 'Prije 2 sata', type: 'motion' },
  { id: '5', message: 'Gubitak veze - Senzor dvorište', time: 'Prije 3 sata', type: 'connection' },
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
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [camRes, senRes] = await Promise.all([
        apiFetch('/api/cameras', { includeAuth: true }),
        apiFetch('/api/sensors', { includeAuth: true }),
      ]);

      if (camRes.status === 401 || senRes.status === 401) {
        clearAuthToken();
        navigate('/login', { replace: true });
        return;
      }

      if (camRes.ok) {
        const camData = await camRes.json();
        setCameras(camData.cameras ?? []);
      }

      if (senRes.ok) {
        const senData = await senRes.json();
        setSensors(senData.sensors ?? []);
      }

      // Bilo koji neuspješan dohvat tretiramo kao grešku — da se kvar API-ja
      // ne prikaže kao prazno stanje ("Nema podataka").
      if (!camRes.ok || !senRes.ok) {
        setError('Greška pri dohvaćanju podataka.');
      }
    } catch {
      setError('Greška pri dohvaćanju podataka.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* Izračunate vrijednosti za stat kartice */
  const activeCameras = cameras.filter((c) => c.isOnline).length;
  const activeSensors = sensors.filter((s) => s.status === 'active').length;
  const onlineSensors = sensors.filter((s) => isSensorOnline(s.last_seen)).length;
  const unreadAlarms = mockAlarms.length;

  // Stanja: spinner dok se učitava, greška s gumbom za ponovni pokušaj ako neki dohvat padne
  if (isLoading) {
    return <LoadingState message="Učitavanje nadzorne ploče..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadData()} />;
  }

  return (
    <>
      {/* Stat kartice */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon stat-icon-cameras">CAM</div>
          <div className="stat-info">
            <span className="stat-value">{activeCameras}/{cameras.length}</span>
            <span className="stat-label">Aktivne kamere</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-sensors">IOT</div>
          <div className="stat-info">
            <span className="stat-value">{activeSensors}/{sensors.length}</span>
            <span className="stat-label">Aktivni senzori</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-online">NET</div>
          <div className="stat-info">
            <span className="stat-value">{onlineSensors}/{sensors.length}</span>
            <span className="stat-label">Online senzori</span>
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
            <span className="sensor-summary-active">Online: {onlineSensors}</span>
            <span className="sensor-summary-divider">|</span>
            <span className="sensor-summary-inactive">Offline: {sensors.length - onlineSensors}</span>
          </div>
          {sensors.length === 0 ? (
            <p className="loading-text">Nema senzora za prikaz.</p>
          ) : (
            <ul className="sensor-list">
              {sensors.map((sensor) => {
                const online = isSensorOnline(sensor.last_seen);
                return (
                  <li key={sensor.id} className="sensor-item">
                    <span className={`sensor-dot ${online ? 'sensor-dot-online' : 'sensor-dot-offline'}`} />
                    <span className="sensor-name">{sensor.name}</span>
                    <span className={`sensor-status ${online ? 'sensor-status-online' : 'sensor-status-offline'}`}>
                      {online ? 'Online' : 'Offline'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Grid kamera */}
      <section className="panel-cameras">
        <h3 className="panel-title">Kamere</h3>
        {cameras.length === 0 ? (
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            }
            message="Nema kamera za prikaz."
          />
        ) : (
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

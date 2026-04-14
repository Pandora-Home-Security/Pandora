import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './CamerasPage.css';
import { apiFetch } from '../lib/api';
import { clearAuthToken } from '../lib/auth';

/* ===== Tipovi ===== */
type Camera = {
  id: string;
  name: string;
  location: string;
  isOnline: boolean;
  resolution: string;
  lastSeen: string;
  ip: string;
};

type FilterStatus = 'all' | 'online' | 'offline';

/* ===== Komponenta ===== */
function CamerasPage() {
  const navigate = useNavigate();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');

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
        setError('Greska pri dohvacanju podataka o kamerama.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadCameras();
  }, [navigate]);

  /* Filtriranje */
  const filteredCameras = cameras.filter((camera) => {
    if (filter === 'online') return camera.isOnline;
    if (filter === 'offline') return !camera.isOnline;
    return true;
  });

  const onlineCount = cameras.filter((c) => c.isOnline).length;
  const offlineCount = cameras.length - onlineCount;

  /* Formatiranje vremena */
  const formatLastSeen = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      return date.toLocaleString('hr-HR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoDate;
    }
  };

  return (
    <>
      {/* Zaglavlje stranice */}
      <div className="cameras-header">
        <div className="cameras-header-left">
          <h2 className="cameras-title">Kamere</h2>
          <p className="cameras-subtitle">Pregled svih kamera u sustavu</p>
        </div>
        <div className="cameras-stats">
          <span className="cameras-stat cameras-stat-total">
            Ukupno: <strong>{cameras.length}</strong>
          </span>
          <span className="cameras-stat cameras-stat-online">
            Online: <strong>{onlineCount}</strong>
          </span>
          <span className="cameras-stat cameras-stat-offline">
            Offline: <strong>{offlineCount}</strong>
          </span>
        </div>
      </div>

      {/* Filter gumbi */}
      <div className="cameras-filters">
        <button
          type="button"
          className={`filter-btn ${filter === 'all' ? 'filter-btn-active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Sve ({cameras.length})
        </button>
        <button
          type="button"
          className={`filter-btn filter-btn-online ${filter === 'online' ? 'filter-btn-active' : ''}`}
          onClick={() => setFilter('online')}
        >
          Online ({onlineCount})
        </button>
        <button
          type="button"
          className={`filter-btn filter-btn-offline ${filter === 'offline' ? 'filter-btn-active' : ''}`}
          onClick={() => setFilter('offline')}
        >
          Offline ({offlineCount})
        </button>
      </div>

      {/* Error poruka */}
      {error && (
        <div className="cameras-error">
          <p>{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="cameras-loading">
          <div className="cameras-loading-spinner" />
          <p>Ucitavanje kamera...</p>
        </div>
      )}

      {/* Grid kamera */}
      {!isLoading && !error && (
        <>
          {filteredCameras.length === 0 ? (
            <div className="cameras-empty">
              <span className="cameras-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </span>
              <p>Nema kamera za prikaz s trenutnim filterom.</p>
            </div>
          ) : (
            <div className="cameras-grid">
              {filteredCameras.map((camera) => (
                <Link
                  to={`/kamere/${camera.id}`}
                  key={camera.id}
                  className="camera-card"
                >
                  {/* Thumbnail placeholder */}
                  <div className={`camera-thumbnail ${camera.isOnline ? 'camera-thumbnail-online' : 'camera-thumbnail-offline'}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="camera-thumbnail-icon">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                    {camera.isOnline && <span className="camera-live-badge">LIVE</span>}
                    {!camera.isOnline && <span className="camera-offline-badge">OFFLINE</span>}
                  </div>

                  {/* Info */}
                  <div className="camera-info">
                    <div className="camera-info-top">
                      <h3 className="camera-name">{camera.name}</h3>
                      <span className={`camera-status-dot ${camera.isOnline ? 'camera-status-online' : 'camera-status-offline'}`} />
                    </div>
                    <div className="camera-meta">
                      <span className="camera-meta-item">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="camera-meta-icon">
                          <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                        </svg>
                        {camera.location}
                      </span>
                      <span className="camera-meta-item">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="camera-meta-icon">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                        </svg>
                        {formatLastSeen(camera.lastSeen)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

export default CamerasPage;

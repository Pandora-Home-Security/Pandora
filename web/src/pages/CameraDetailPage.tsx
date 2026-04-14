import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import './CameraDetailPage.css';
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

/* ===== Komponenta ===== */
function CameraDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [camera, setCamera] = useState<Camera | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCamera = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await apiFetch(`/api/cameras/${id}`, {
          includeAuth: true,
        });
        const data = await response.json();

        if (response.status === 401) {
          clearAuthToken();
          navigate('/login', { replace: true });
          return;
        }

        if (response.status === 404) {
          setError('Kamera nije pronadena.');
          return;
        }

        if (!response.ok) {
          setError(data.message || 'Neuspjesno dohvacanje podataka o kameri.');
          return;
        }

        setCamera(data.camera ?? null);
      } catch {
        setError('Greska pri dohvacanju podataka o kameri.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadCamera();
  }, [id, navigate]);

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
        second: '2-digit',
      });
    } catch {
      return isoDate;
    }
  };

  return (
    <>
      {/* Breadcrumb navigacija */}
      <div className="camera-detail-breadcrumb">
        <Link to="/kamere" className="breadcrumb-link">
          <svg viewBox="0 0 20 20" fill="currentColor" className="breadcrumb-icon">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 011.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Natrag na kamere
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="camera-detail-loading">
          <div className="camera-detail-spinner" />
          <p>Ucitavanje kamere...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="camera-detail-error">
          <p>{error}</p>
          <Link to="/kamere" className="camera-detail-back-btn">
            Povratak na popis kamera
          </Link>
        </div>
      )}

      {/* Sadrzaj */}
      {!isLoading && !error && camera && (
        <div className="camera-detail-content">
          {/* Video placeholder */}
          <div className={`camera-detail-video ${camera.isOnline ? 'camera-detail-video-online' : 'camera-detail-video-offline'}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="camera-detail-video-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            {camera.isOnline ? (
              <p className="camera-detail-video-text">Video stream - dolazi u sljedecem milestone-u</p>
            ) : (
              <p className="camera-detail-video-text">Kamera je offline</p>
            )}
            {camera.isOnline && <span className="camera-detail-live-badge">LIVE</span>}
          </div>

          {/* Detalji kamere */}
          <div className="camera-detail-panels">
            {/* Osnovni podaci */}
            <div className="camera-detail-panel">
              <h3 className="camera-detail-panel-title">Podaci o kameri</h3>
              <div className="camera-detail-fields">
                <div className="camera-detail-field">
                  <span className="camera-detail-label">Naziv</span>
                  <span className="camera-detail-value">{camera.name}</span>
                </div>
                <div className="camera-detail-field">
                  <span className="camera-detail-label">Lokacija</span>
                  <span className="camera-detail-value">{camera.location}</span>
                </div>
                <div className="camera-detail-field">
                  <span className="camera-detail-label">Status</span>
                  <span className={`camera-detail-status ${camera.isOnline ? 'camera-detail-status-online' : 'camera-detail-status-offline'}`}>
                    <span className={`camera-detail-status-dot ${camera.isOnline ? 'dot-online' : 'dot-offline'}`} />
                    {camera.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="camera-detail-field">
                  <span className="camera-detail-label">Rezolucija</span>
                  <span className="camera-detail-value">{camera.resolution}</span>
                </div>
                <div className="camera-detail-field">
                  <span className="camera-detail-label">IP adresa</span>
                  <span className="camera-detail-value camera-detail-mono">{camera.ip}</span>
                </div>
                <div className="camera-detail-field">
                  <span className="camera-detail-label">Zadnji signal</span>
                  <span className="camera-detail-value">{formatLastSeen(camera.lastSeen)}</span>
                </div>
              </div>
            </div>

            {/* Brze akcije placeholder */}
            <div className="camera-detail-panel">
              <h3 className="camera-detail-panel-title">Brze akcije</h3>
              <div className="camera-detail-actions">
                <button type="button" className="camera-action-btn" disabled>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="camera-action-icon">
                    <path d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm13.5 3a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM10 14a3 3 0 100-6 3 3 0 000 6z" />
                  </svg>
                  <span>Snimi snimku</span>
                </button>
                <button type="button" className="camera-action-btn" disabled>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="camera-action-icon">
                    <path d="M3.25 4A2.25 2.25 0 001 6.25v7.5A2.25 2.25 0 003.25 16h7.5A2.25 2.25 0 0013 13.75v-7.5A2.25 2.25 0 0010.75 4h-7.5zM19 4.75a.75.75 0 00-1.28-.53l-3 3a.75.75 0 00-.22.53v4.5c0 .199.079.39.22.53l3 3a.75.75 0 001.28-.53V4.75z" />
                  </svg>
                  <span>Pokreni snimanje</span>
                </button>
                <button type="button" className="camera-action-btn" disabled>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="camera-action-icon">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <span>Postavi alarm</span>
                </button>
              </div>
              <p className="camera-detail-actions-note">Akcije dolaze u sljedecem milestone-u.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CameraDetailPage;

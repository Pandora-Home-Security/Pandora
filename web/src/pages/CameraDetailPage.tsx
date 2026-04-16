import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import './CameraDetailPage.css';
import { apiFetch } from '../lib/api';
import { clearAuthToken } from '../lib/auth';
import CameraFormModal from '../components/CameraFormModal';
import ConfirmModal from '../components/ConfirmModal';

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

  /* CRUD modali */
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  /* Video kontrole */
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Dohvati podatke o kameri */
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
          setError('Kamera nije pronađena.');
          return;
        }

        if (!response.ok) {
          setError(data.message || 'Neuspješno dohvaćanje podataka o kameri.');
          return;
        }

        setCamera(data.camera ?? null);
      } catch {
        setError('Greška pri dohvaćanju podataka o kameri.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadCamera();
  }, [id, navigate]);

  /* Sat za simulaciju live streama */
  useEffect(() => {
    if (!camera?.isOnline || !isPlaying) return;

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [camera?.isOnline, isPlaying]);

  /* Auto-hide kontrole */
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  /* Fullscreen toggle */
  const toggleFullscreen = useCallback(async () => {
    if (!videoContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await videoContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      /* Fallback ako fullscreen nije podržan */
    }
  }, []);

  /* Slušaj fullscreen change event */
  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

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

  /* Spremi uredivanje */
  const handleEditSubmit = async (data: { name: string; location: string; streamUrl: string }) => {
    const response = await apiFetch(`/api/cameras/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      includeAuth: true,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Greska pri azuriranju.');
    setCamera(result.camera);
    setIsFormOpen(false);
  };

  /* Potvrdi brisanje */
  const handleDeleteConfirm = async () => {
    const response = await apiFetch(`/api/cameras/${id}`, {
      method: 'DELETE',
      includeAuth: true,
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Greska pri brisanju.');
    }
    navigate('/kamere', { replace: true });
  };

  return (
    <>
      {/* Breadcrumb + akcije */}
      <div className="camera-detail-top-bar">
        <div className="camera-detail-breadcrumb">
          <Link to="/kamere" className="breadcrumb-link">
            <svg viewBox="0 0 20 20" fill="currentColor" className="breadcrumb-icon">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 011.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Natrag na kamere
          </Link>
          {camera && (
            <span className="breadcrumb-current">
              <svg viewBox="0 0 20 20" fill="currentColor" className="breadcrumb-separator">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
              {camera.name}
            </span>
          )}
        </div>
        {camera && (
          <div className="camera-detail-crud-actions">
            <button type="button" className="crud-btn crud-btn-edit" onClick={() => setIsFormOpen(true)}>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
              </svg>
              Uredi
            </button>
            <button type="button" className="crud-btn crud-btn-delete" onClick={() => setIsDeleteOpen(true)}>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
              </svg>
              Obrisi
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="camera-detail-loading">
          <div className="camera-detail-spinner" />
          <p>Učitavanje kamere...</p>
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

      {/* Sadržaj */}
      {!isLoading && !error && camera && (
        <div className="camera-detail-content">

          {/* ===== Video Player ===== */}
          <div
            ref={videoContainerRef}
            className={`video-player ${camera.isOnline ? 'video-player--online' : 'video-player--offline'} ${isFullscreen ? 'video-player--fullscreen' : ''}`}
            onMouseMove={resetControlsTimer}
            onMouseEnter={resetControlsTimer}
            onMouseLeave={() => setShowControls(false)}
          >
            {/* Animirani grid efekt - simulacija video feeda */}
            {camera.isOnline && (
              <div className="video-feed" aria-hidden="true">
                <div className="video-feed-scanlines"></div>
                <div className="video-feed-noise"></div>
                <div className="video-feed-vignette"></div>

                {/* Simulirani sadržaj kamere */}
                <div className="video-feed-content">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="video-feed-house">
                    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            )}

            {/* Offline sadržaj */}
            {!camera.isOnline && (
              <div className="video-offline">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="video-offline-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <p className="video-offline-text">Kamera je offline</p>
                <p className="video-offline-subtext">Zadnji signal: {formatLastSeen(camera.lastSeen)}</p>
              </div>
            )}

            {/* LIVE badge */}
            {camera.isOnline && (
              <div className="video-top-bar">
                <span className="video-live-badge">
                  <span className="video-live-dot"></span>
                  LIVE
                </span>
                <span className="video-resolution-badge">{camera.resolution}</span>
              </div>
            )}

            {/* Timestamp overlay */}
            {camera.isOnline && (
              <div className="video-timestamp">
                <span className="video-camera-name">{camera.name}</span>
                <span className="video-time">{currentTime}</span>
              </div>
            )}

            {/* Kontrole */}
            {camera.isOnline && (
              <div className={`video-controls ${showControls ? 'video-controls--visible' : ''}`}>
                <div className="video-controls-left">
                  {/* Play/Pause */}
                  <button
                    type="button"
                    className="video-control-btn"
                    onClick={() => setIsPlaying(!isPlaying)}
                    aria-label={isPlaying ? 'Pauziraj stream' : 'Nastavi stream'}
                  >
                    {isPlaying ? (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  {/* Status tekst */}
                  <span className="video-status-text">
                    {isPlaying ? 'Uživo' : 'Pauzirano'}
                  </span>
                </div>

                <div className="video-controls-right">
                  {/* Fullscreen */}
                  <button
                    type="button"
                    className="video-control-btn"
                    onClick={toggleFullscreen}
                    aria-label={isFullscreen ? 'Izađi iz punog zaslona' : 'Puni zaslon'}
                  >
                    {isFullscreen ? (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M3.22 3.22a.75.75 0 011.06 0l3.97 3.97V4.5a.75.75 0 011.5 0V9a.75.75 0 01-.75.75H4.5a.75.75 0 010-1.5h2.69L3.22 4.28a.75.75 0 010-1.06zm17.56 0a.75.75 0 010 1.06l-3.97 3.97h2.69a.75.75 0 010 1.5H15a.75.75 0 01-.75-.75V4.5a.75.75 0 011.5 0v2.69l3.97-3.97a.75.75 0 011.06 0zM3.75 15a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-2.69l-3.97 3.97a.75.75 0 01-1.06-1.06l3.97-3.97H4.5a.75.75 0 01-.75-.75zm10.5 0a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-2.69l3.97 3.97a.75.75 0 11-1.06 1.06l-3.97-3.97v2.69a.75.75 0 01-1.5 0V15z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M15 3.75a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0V5.56l-3.97 3.97a.75.75 0 11-1.06-1.06l3.97-3.97h-2.69a.75.75 0 01-.75-.75zm-12 0A.75.75 0 013.75 3h4.5a.75.75 0 010 1.5H5.56l3.97 3.97a.75.75 0 01-1.06 1.06L4.5 5.56v2.69a.75.75 0 01-1.5 0v-4.5zm11.47 11.78a.75.75 0 111.06-1.06l3.97 3.97v-2.69a.75.75 0 011.5 0v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 010-1.5h2.69l-3.97-3.97zm-7.94-1.06a.75.75 0 010 1.06L2.56 19.5h2.69a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75v-4.5a.75.75 0 011.5 0v2.69l3.97-3.97a.75.75 0 011.06 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Pauzirano overlay */}
            {camera.isOnline && !isPlaying && (
              <div className="video-paused-overlay">
                <svg viewBox="0 0 24 24" fill="currentColor" className="video-paused-icon">
                  <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                </svg>
                <p>Stream pauziran</p>
              </div>
            )}
          </div>

          {/* ===== Paneli s detaljima ===== */}
          <div className="camera-detail-panels">

            {/* Podaci o kameri */}
            <div className="camera-detail-panel">
              <h3 className="camera-detail-panel-title">
                <svg viewBox="0 0 20 20" fill="currentColor" className="panel-title-icon">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
                Podaci o kameri
              </h3>
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

            {/* Brze akcije */}
            <div className="camera-detail-panel">
              <h3 className="camera-detail-panel-title">
                <svg viewBox="0 0 20 20" fill="currentColor" className="panel-title-icon">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                Brze akcije
              </h3>
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
              <p className="camera-detail-actions-note">Akcije dolaze u sljedećem milestone-u.</p>
            </div>
          </div>
        </div>
      )}
      {/* Modal za uredivanje */}
      <CameraFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleEditSubmit}
        isEdit
        initialData={camera ? { name: camera.name, location: camera.location, streamUrl: '' } : null}
      />

      {/* Modal za potvrdu brisanja */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        title="Obrisati kameru?"
        message={`Jeste li sigurni da zelite obrisati kameru "${camera?.name ?? ''}"? Ova akcija se ne moze ponistiti.`}
        confirmText="Obrisi"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </>
  );
}

export default CameraDetailPage;

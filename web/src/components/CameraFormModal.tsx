import { useState, useEffect } from 'react';
import './CameraFormModal.css';

type CameraFormData = {
  name: string;
  location: string;
  streamUrl: string;
};

type CameraFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CameraFormData) => Promise<void>;
  initialData?: CameraFormData | null;
  isEdit?: boolean;
};

function CameraFormModal({ isOpen, onClose, onSubmit, initialData, isEdit }: CameraFormModalProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name);
      setLocation(initialData.location);
      setStreamUrl(initialData.streamUrl);
    } else if (isOpen) {
      setName('');
      setLocation('');
      setStreamUrl('');
    }
    setError('');
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Naziv kamere je obavezan.');
      return;
    }
    if (!location.trim()) {
      setError('Lokacija je obavezna.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), location: location.trim(), streamUrl: streamUrl.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Doslo je do greske.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Uredi kameru' : 'Dodaj novu kameru'}</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Zatvori">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <p className="modal-error">{error}</p>}

          <div className="modal-field">
            <label htmlFor="camera-name" className="modal-label">Naziv kamere *</label>
            <input
              id="camera-name"
              type="text"
              className="modal-input"
              placeholder="npr. Ulazna vrata"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="modal-field">
            <label htmlFor="camera-location" className="modal-label">Lokacija *</label>
            <input
              id="camera-location"
              type="text"
              className="modal-input"
              placeholder="npr. Ulaz, Prizemlje, 1. kat"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="modal-field">
            <label htmlFor="camera-stream" className="modal-label">Stream URL</label>
            <input
              id="camera-stream"
              type="text"
              className="modal-input"
              placeholder="rtsp://192.168.1.100:554/stream (opcionalno)"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              disabled={isSubmitting}
            />
            <span className="modal-hint">Opcionalno — URL za RTSP ili HTTP video stream.</span>
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn modal-btn-cancel" onClick={onClose} disabled={isSubmitting}>
              Odustani
            </button>
            <button type="submit" className="modal-btn modal-btn-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Spremanje...' : isEdit ? 'Spremi promjene' : 'Dodaj kameru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CameraFormModal;

import { useState, useEffect } from 'react';
import './CameraFormModal.css';

type SensorType = 'door' | 'window' | 'smoke' | 'temperature' | 'motion';

type SensorFormData = {
  name: string;
  type: SensorType;
  location: string;
  status?: 'active' | 'inactive';
};

type SensorFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SensorFormData) => Promise<void>;
  initialData?: SensorFormData | null;
  isEdit?: boolean;
};

const typeOptions: { value: SensorType; label: string }[] = [
  { value: 'door', label: 'Vrata' },
  { value: 'window', label: 'Prozor' },
  { value: 'smoke', label: 'Dim' },
  { value: 'temperature', label: 'Temperatura' },
  { value: 'motion', label: 'Pokret' },
];

function SensorFormModal({ isOpen, onClose, onSubmit, initialData, isEdit }: SensorFormModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<SensorType>('door');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setLocation(initialData.location);
      setStatus(initialData.status ?? 'active');
    } else if (isOpen) {
      setName('');
      setType('door');
      setLocation('');
      setStatus('active');
    }
    setError('');
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Naziv senzora je obavezan.');
      return;
    }
    if (!location.trim()) {
      setError('Lokacija je obavezna.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        location: location.trim(),
        ...(isEdit ? { status } : {}),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Došlo je do greške.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Uredi senzor' : 'Dodaj novi senzor'}</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Zatvori">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <p className="modal-error">{error}</p>}

          <div className="modal-field">
            <label htmlFor="sensor-name" className="modal-label">Naziv senzora *</label>
            <input
              id="sensor-name"
              type="text"
              className="modal-input"
              placeholder="npr. Senzor ulaznih vrata"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="modal-field">
            <label htmlFor="sensor-type" className="modal-label">Tip *</label>
            <select
              id="sensor-type"
              className="modal-input"
              value={type}
              onChange={(e) => setType(e.target.value as SensorType)}
              disabled={isSubmitting}
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="modal-field">
            <label htmlFor="sensor-location" className="modal-label">Lokacija *</label>
            <input
              id="sensor-location"
              type="text"
              className="modal-input"
              placeholder="npr. Ulaz, Kuhinja, 1. kat"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {isEdit && (
            <div className="modal-field">
              <label htmlFor="sensor-status" className="modal-label">Status</label>
              <select
                id="sensor-status"
                className="modal-input"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                disabled={isSubmitting}
              >
                <option value="active">Aktivan</option>
                <option value="inactive">Neaktivan</option>
              </select>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="modal-btn modal-btn-cancel" onClick={onClose} disabled={isSubmitting}>
              Odustani
            </button>
            <button type="submit" className="modal-btn modal-btn-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Spremanje...' : isEdit ? 'Spremi promjene' : 'Dodaj senzor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SensorFormModal;

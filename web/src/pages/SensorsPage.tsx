import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';
import SensorFormModal from '../components/SensorFormModal';
import ConfirmModal from '../components/ConfirmModal';
import './SensorsPage.css';

/* ===== Tipovi ===== */
type SensorType = 'door' | 'window' | 'smoke' | 'temperature' | 'motion';

type Sensor = {
  id: string;
  name: string;
  type: SensorType;
  location: string;
  status: 'active' | 'inactive';
  api_key?: string;
  last_seen: string | null;
  created_at: string;
};

type DeviceEvent = {
  id: string;
  device_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
};

type FilterType = 'all' | SensorType;
type FilterStatus = 'all' | 'active' | 'inactive';

/* ===== Pomoćne konstante ===== */
const typeLabels: Record<SensorType, string> = {
  door:        'Vrata',
  window:      'Prozor',
  smoke:       'Dim',
  temperature: 'Temperatura',
  motion:      'Pokret',
};

const eventTypeLabels: Record<string, string> = {
  reading:       'Očitanje',
  alert:         'Upozorenje',
  status_change: 'Promjena statusa',
  battery_low:   'Slaba baterija',
  offline:       'Offline',
  online:        'Online',
};

/* ===== SVG ikone po tipu senzora ===== */
const SensorIcon = ({ type }: { type: SensorType }) => {
  switch (type) {
    case 'door':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20h16" />
          <path d="M6 20V4h12v16" />
          <circle cx="15" cy="12" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'window':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="1.5" />
          <path d="M4 12h16M12 4v16" />
        </svg>
      );
    case 'smoke':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 18c0-1.5 1-2 2-2s2 .5 2 2" />
          <path d="M9 14c0-1.5 1.2-2.3 2.5-2.3s2.5.8 2.5 2.3" />
          <path d="M13 10c0-1.8 1.3-2.8 3-2.8s3 1 3 2.8" />
          <path d="M3 21h18" />
        </svg>
      );
    case 'temperature':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 14.76V5a2 2 0 1 0-4 0v9.76a4 4 0 1 0 4 0z" />
          <line x1="12" y1="9" x2="12" y2="15" />
        </svg>
      );
    case 'motion':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="1.6" />
          <path d="M10 22l2-6 2 6" />
          <path d="M8 12l4-3 4 3-2 4h-4z" />
          <path d="M6 10l-2 2M18 10l2 2" />
        </svg>
      );
  }
};

/* ===== Ikona lokacije (pin) ===== */
const PinIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="sensor-meta-icon" aria-hidden="true">
    <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
  </svg>
);

/* ===== Komponenta ===== */
function SensorsPage() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const [showFormModal, setShowFormModal] = useState(false);
  const [editSensor, setEditSensor] = useState<Sensor | null>(null);
  const [deleteSensor, setDeleteSensor] = useState<Sensor | null>(null);
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);

  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const fetchSensors = useCallback(async () => {
    try {
      const res = await apiFetch('/api/sensors', { includeAuth: true });
      if (!res.ok) throw new Error('Greška pri dohvatu senzora.');
      const data = await res.json();
      setSensors(data.sensors);
    } catch {
      setError('Nije moguće dohvatiti senzore.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSensors(); }, [fetchSensors]);

  const fetchEvents = useCallback(async (sensorId: string) => {
    setEventsLoading(true);
    try {
      const res = await apiFetch(`/api/sensors/${sensorId}/events?limit=50`, { includeAuth: true });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEvents(data.events);
    } catch {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const handleCardClick = (sensor: Sensor) => {
    if (selectedSensorId === sensor.id) {
      setSelectedSensorId(null);
      setEvents([]);
    } else {
      setSelectedSensorId(sensor.id);
      fetchEvents(sensor.id);
    }
  };

  const handleCreate = async (data: { name: string; type: SensorType; location: string }) => {
    const res = await apiFetch('/api/sensors', {
      method: 'POST',
      includeAuth: true,
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    setCreatedApiKey(json.sensor.api_key);
    await fetchSensors();
    setShowFormModal(false);
  };

  const handleEdit = async (data: { name: string; type: SensorType; location: string; status?: string }) => {
    if (!editSensor) return;
    const res = await apiFetch(`/api/sensors/${editSensor.id}`, {
      method: 'PUT',
      includeAuth: true,
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    await fetchSensors();
    setEditSensor(null);
  };

  const handleDelete = async () => {
    if (!deleteSensor) return;
    const res = await apiFetch(`/api/sensors/${deleteSensor.id}`, {
      method: 'DELETE',
      includeAuth: true,
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.message);
    }
    if (selectedSensorId === deleteSensor.id) {
      setSelectedSensorId(null);
      setEvents([]);
    }
    await fetchSensors();
    setDeleteSensor(null);
  };

  /* Filtriranje */
  const filtered = useMemo(
    () =>
      sensors.filter((s) => {
        if (filterType !== 'all' && s.type !== filterType) return false;
        if (filterStatus !== 'all' && s.status !== filterStatus) return false;
        return true;
      }),
    [sensors, filterType, filterStatus],
  );

  const activeCount = sensors.filter((s) => s.status === 'active').length;
  const inactiveCount = sensors.length - activeCount;

  if (loading) {
    return (
      <div className="sensors-empty">
        <div className="sensors-spinner" />
        <p>Učitavanje senzora...</p>
      </div>
    );
  }

  return (
    <>
      {/* Zaglavlje */}
      <div className="sensors-header">
        <div className="sensors-header-left">
          <h2 className="sensors-title">IoT senzori</h2>
          <p className="sensors-subtitle">Pregled i upravljanje senzorima u sustavu</p>
        </div>
        <div className="sensors-header-right">
          <button
            type="button"
            className="sensors-add-btn"
            onClick={() => setShowFormModal(true)}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Dodaj senzor
          </button>
          <div className="sensors-stat-card">
            <span className="sensors-stat-label">Ukupno</span>
            <span className="sensors-stat-value">{sensors.length}</span>
          </div>
          <div className="sensors-stat-card sensors-stat-card-active">
            <span className="sensors-stat-dot" />
            <span className="sensors-stat-label">Aktivni</span>
            <span className="sensors-stat-value">{activeCount}</span>
          </div>
          <div className="sensors-stat-card sensors-stat-card-inactive">
            <span className="sensors-stat-dot" />
            <span className="sensors-stat-label">Neaktivni</span>
            <span className="sensors-stat-value">{inactiveCount}</span>
          </div>
        </div>
      </div>

      {error && <p className="sensors-error">{error}</p>}

      {/* Filteri */}
      <div className="sensors-filters">
        <div className="sensors-filter-group">
          <span className="sensors-filter-label">Tip</span>
          <div className="sensors-filter-segment">
            {(['all', 'door', 'window', 'smoke', 'temperature', 'motion'] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`sensors-filter-btn ${filterType === t ? 'sensors-filter-btn-active' : ''}`}
                onClick={() => setFilterType(t)}
              >
                {t === 'all' ? 'Svi' : typeLabels[t]}
              </button>
            ))}
          </div>
        </div>
        <div className="sensors-filter-group">
          <span className="sensors-filter-label">Status</span>
          <div className="sensors-filter-segment">
            {(['all', 'active', 'inactive'] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={`sensors-filter-btn ${filterStatus === s ? 'sensors-filter-btn-active' : ''}`}
                onClick={() => setFilterStatus(s)}
              >
                {s === 'all' ? 'Svi' : s === 'active' ? 'Aktivni' : 'Neaktivni'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prikaz senzora */}
      {filtered.length === 0 ? (
        <div className="sensors-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="sensors-empty-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" />
          </svg>
          <p>Nema senzora za prikaz.</p>
        </div>
      ) : (
        <>
          {/* Kartice */}
          <div className="sensors-grid">
            {filtered.map((sensor) => (
              <article
                key={sensor.id}
                className={`sensor-card sensor-card-${sensor.status} ${selectedSensorId === sensor.id ? 'sensor-card-selected' : ''}`}
                onClick={() => handleCardClick(sensor)}
              >
                <div className="sensor-card-glow" aria-hidden="true" />
                <div className="sensor-card-header">
                  <div className={`sensor-icon-wrap sensor-icon-${sensor.type}`} aria-hidden="true">
                    <SensorIcon type={sensor.type} />
                  </div>
                  <div className="sensor-card-actions">
                    <button
                      type="button"
                      className="sensor-action-btn"
                      title="Uredi"
                      onClick={(e) => { e.stopPropagation(); setEditSensor(sensor); }}
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" /></svg>
                    </button>
                    <button
                      type="button"
                      className="sensor-action-btn sensor-action-btn-danger"
                      title="Obriši"
                      onClick={(e) => { e.stopPropagation(); setDeleteSensor(sensor); }}
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.7.797l-.5 6a.75.75 0 01-1.497-.126l.5-6a.75.75 0 01.797-.67zm3.637.797a.75.75 0 10-1.497-.126l-.5 6a.75.75 0 101.497.126l.5-6z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </div>

                <div className="sensor-card-body">
                  <h3 className="sensor-card-name">{sensor.name}</h3>
                  <div className="sensor-card-meta">
                    <span className={`sensor-type-badge sensor-type-${sensor.type}`}>
                      {typeLabels[sensor.type]}
                    </span>
                    <span className="sensor-location">
                      <PinIcon />
                      {sensor.location}
                    </span>
                  </div>
                </div>

                <div className="sensor-card-footer">
                  <div className={`sensor-status-pill sensor-status-pill-${sensor.status}`}>
                    <span className="sensor-status-dot" />
                    {sensor.status === 'active' ? 'Aktivan' : 'Neaktivan'}
                  </div>
                  <span className="sensor-reading-value">
                    {sensor.last_seen
                      ? new Date(sensor.last_seen).toLocaleString('hr-HR')
                      : 'Nikad'}
                  </span>
                </div>
              </article>
            ))}
          </div>

          {/* Panel s događajima odabranog senzora */}
          {selectedSensorId && (
            <div className="sensors-events-section">
              <div className="sensors-table-heading">
                <h3 className="sensors-table-title">
                  Događaji — {sensors.find((s) => s.id === selectedSensorId)?.name}
                </h3>
                <span className="sensors-table-count">
                  {events.length} {events.length === 1 ? 'događaj' : 'događaja'}
                </span>
              </div>
              {eventsLoading ? (
                <div className="sensors-empty"><div className="sensors-spinner" /><p>Učitavanje...</p></div>
              ) : events.length === 0 ? (
                <div className="sensors-empty"><p>Nema zabilježenih događaja za ovaj senzor.</p></div>
              ) : (
                <div className="sensors-table-wrapper">
                  <table className="sensors-table">
                    <thead>
                      <tr>
                        <th>Tip događaja</th>
                        <th>Podaci</th>
                        <th>Vrijeme</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((ev) => (
                        <tr key={ev.id}>
                          <td>
                            <span className={`sensor-event-badge sensor-event-${ev.event_type}`}>
                              {eventTypeLabels[ev.event_type] ?? ev.event_type}
                            </span>
                          </td>
                          <td className="sensor-cell-reading">
                            {Object.keys(ev.payload).length > 0
                              ? JSON.stringify(ev.payload)
                              : '—'}
                          </td>
                          <td className="sensor-cell-location">
                            {new Date(ev.created_at).toLocaleString('hr-HR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tablica svih senzora */}
          <div className="sensors-table-section">
            <div className="sensors-table-heading">
              <h3 className="sensors-table-title">Detaljan pregled</h3>
              <span className="sensors-table-count">
                {filtered.length} {filtered.length === 1 ? 'senzor' : 'senzora'}
              </span>
            </div>
            <div className="sensors-table-wrapper">
              <table className="sensors-table">
                <thead>
                  <tr>
                    <th>Naziv</th>
                    <th>Tip</th>
                    <th>Lokacija</th>
                    <th>Zadnje viđen</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sensor) => (
                    <tr key={sensor.id}>
                      <td className="sensor-cell-name">
                        <div className="sensor-cell-name-inner">
                          <span className={`sensor-cell-icon sensor-icon-${sensor.type}`}>
                            <SensorIcon type={sensor.type} />
                          </span>
                          {sensor.name}
                        </div>
                      </td>
                      <td>
                        <span className={`sensor-type-badge sensor-type-${sensor.type}`}>
                          {typeLabels[sensor.type]}
                        </span>
                      </td>
                      <td className="sensor-cell-location">{sensor.location}</td>
                      <td className="sensor-cell-reading">
                        {sensor.last_seen
                          ? new Date(sensor.last_seen).toLocaleString('hr-HR')
                          : '—'}
                      </td>
                      <td>
                        <span className={`sensor-status-pill sensor-status-pill-${sensor.status}`}>
                          <span className="sensor-status-dot" />
                          {sensor.status === 'active' ? 'Aktivan' : 'Neaktivan'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modali */}
      <SensorFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleCreate}
      />

      <SensorFormModal
        isOpen={!!editSensor}
        onClose={() => setEditSensor(null)}
        onSubmit={handleEdit}
        initialData={editSensor ? { name: editSensor.name, type: editSensor.type, location: editSensor.location, status: editSensor.status } : null}
        isEdit
      />

      <ConfirmModal
        isOpen={!!deleteSensor}
        title="Obriši senzor"
        message={`Jeste li sigurni da želite obrisati senzor "${deleteSensor?.name}"? Svi povezani događaji će također biti obrisani.`}
        confirmText="Obriši"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteSensor(null)}
      />

      {/* Modal za prikaz API ključa nakon kreiranja */}
      {createdApiKey && (
        <div className="modal-backdrop" onClick={() => setCreatedApiKey(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Senzor uspješno dodan</h3>
              <button type="button" className="modal-close-btn" onClick={() => setCreatedApiKey(null)} aria-label="Zatvori">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
            <div className="modal-form">
              <p className="api-key-notice">
                Spremite ovaj API ključ — prikazuje se samo jednom. Uređaj ga koristi za slanje događaja putem <code>Authorization: Bearer API_KEY</code>.
              </p>
              <div className="api-key-box">
                <code>{createdApiKey}</code>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn modal-btn-submit"
                  onClick={() => {
                    navigator.clipboard.writeText(createdApiKey);
                  }}
                >
                  Kopiraj ključ
                </button>
                <button
                  type="button"
                  className="modal-btn modal-btn-cancel"
                  onClick={() => setCreatedApiKey(null)}
                >
                  Zatvori
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SensorsPage;

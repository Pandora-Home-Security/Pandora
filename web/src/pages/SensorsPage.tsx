import { useMemo, useState } from 'react';
import './SensorsPage.css';

/* ===== Tipovi ===== */
type SensorType = 'door' | 'window' | 'smoke' | 'temperature' | 'motion';
type SensorStatus = 'active' | 'inactive';

type Sensor = {
  id: string;
  name: string;
  type: SensorType;
  location: string;
  status: SensorStatus;
  lastReading?: string;
};

type FilterType = 'all' | SensorType;
type FilterStatus = 'all' | SensorStatus;

/* ===== Pomoćne konstante ===== */
const typeLabels: Record<SensorType, string> = {
  door:        'Vrata',
  window:      'Prozor',
  smoke:       'Dim',
  temperature: 'Temperatura',
  motion:      'Pokret',
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

/* ===== Mock podaci (zamijeniti API pozivom kad backend endpoint bude spreman) ===== */
const mockSensors: Sensor[] = [
  { id: '1', name: 'Senzor ulaznih vrata',       type: 'door',        location: 'Ulaz',            status: 'active',   lastReading: 'Zatvoreno' },
  { id: '2', name: 'Senzor prozora dnevni',      type: 'window',      location: 'Dnevni boravak',  status: 'active',   lastReading: 'Zatvoreno' },
  { id: '3', name: 'Detektor dima kuhinja',      type: 'smoke',       location: 'Kuhinja',         status: 'active',   lastReading: 'OK' },
  { id: '4', name: 'Termometar spremište',       type: 'temperature', location: 'Spremište',       status: 'active',   lastReading: '22.4 °C' },
  { id: '5', name: 'Senzor garažnih vrata',      type: 'door',        location: 'Garaža',          status: 'inactive', lastReading: '—' },
  { id: '6', name: 'Senzor pokreta dvorište',    type: 'motion',      location: 'Dvorište',        status: 'inactive', lastReading: '—' },
  { id: '7', name: 'Senzor prozora spavaća',     type: 'window',      location: 'Spavaća soba',    status: 'active',   lastReading: 'Zatvoreno' },
  { id: '8', name: 'Detektor dima hodnik',       type: 'smoke',       location: 'Hodnik',          status: 'active',   lastReading: 'OK' },
  { id: '9', name: 'Termometar dnevni boravak',  type: 'temperature', location: 'Dnevni boravak',  status: 'active',   lastReading: '23.1 °C' },
  { id: '10', name: 'Senzor pokreta hodnik',     type: 'motion',      location: 'Hodnik',          status: 'active',   lastReading: 'Mirno' },
];

/* ===== Ikona lokacije (pin) ===== */
const PinIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="sensor-meta-icon" aria-hidden="true">
    <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
  </svg>
);

/* ===== Komponenta ===== */
function SensorsPage() {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  /* Filtriranje */
  const filtered = useMemo(
    () =>
      mockSensors.filter((s) => {
        if (filterType !== 'all' && s.type !== filterType) return false;
        if (filterStatus !== 'all' && s.status !== filterStatus) return false;
        return true;
      }),
    [filterType, filterStatus],
  );

  const activeCount = mockSensors.filter((s) => s.status === 'active').length;
  const inactiveCount = mockSensors.length - activeCount;

  return (
    <>
      {/* Zaglavlje */}
      <div className="sensors-header">
        <div className="sensors-header-left">
          <h2 className="sensors-title">IoT senzori</h2>
          <p className="sensors-subtitle">Pregled svih senzora u sustavu</p>
        </div>
        <div className="sensors-header-right">
          <div className="sensors-stat-card">
            <span className="sensors-stat-label">Ukupno</span>
            <span className="sensors-stat-value">{mockSensors.length}</span>
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
          <p>Nema senzora za prikaz s trenutnim filterima.</p>
        </div>
      ) : (
        <>
          {/* Kartice */}
          <div className="sensors-grid">
            {filtered.map((sensor) => (
              <article key={sensor.id} className={`sensor-card sensor-card-${sensor.status}`}>
                <div className="sensor-card-glow" aria-hidden="true" />
                <div className="sensor-card-header">
                  <div className={`sensor-icon-wrap sensor-icon-${sensor.type}`} aria-hidden="true">
                    <SensorIcon type={sensor.type} />
                  </div>
                  <div className={`sensor-status-pill sensor-status-pill-${sensor.status}`}>
                    <span className="sensor-status-dot" />
                    {sensor.status === 'active' ? 'Aktivan' : 'Neaktivan'}
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
                  <span className="sensor-reading-label">Zadnje očitanje</span>
                  <span className="sensor-reading-value">{sensor.lastReading ?? '—'}</span>
                </div>
              </article>
            ))}
          </div>

          {/* Tablica (alternativni prikaz za širi pregled) */}
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
                    <th>Zadnje očitanje</th>
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
                      <td className="sensor-cell-reading">{sensor.lastReading ?? '—'}</td>
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
    </>
  );
}

export default SensorsPage;

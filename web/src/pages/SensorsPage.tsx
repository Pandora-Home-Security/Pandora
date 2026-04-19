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

const typeIcons: Record<SensorType, string> = {
  door:        '🚪',
  window:      '🪟',
  smoke:       '💨',
  temperature: '🌡️',
  motion:      '🏃',
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
          <span className="sensors-stat">
            Ukupno: <strong>{mockSensors.length}</strong>
          </span>
          <span className="sensors-stat sensors-stat-active">
            Aktivni: <strong>{activeCount}</strong>
          </span>
          <span className="sensors-stat sensors-stat-inactive">
            Neaktivni: <strong>{inactiveCount}</strong>
          </span>
        </div>
      </div>

      {/* Filteri */}
      <div className="sensors-filters">
        <div className="sensors-filter-group">
          <span className="sensors-filter-label">Tip:</span>
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
        <div className="sensors-filter-group">
          <span className="sensors-filter-label">Status:</span>
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
                <div className="sensor-card-header">
                  <span className={`sensor-icon sensor-icon-${sensor.type}`} aria-hidden="true">
                    {typeIcons[sensor.type]}
                  </span>
                  <span className={`sensor-status-dot sensor-status-dot-${sensor.status}`} />
                </div>
                <h3 className="sensor-card-name">{sensor.name}</h3>
                <div className="sensor-card-meta">
                  <span className={`sensor-type-badge sensor-type-${sensor.type}`}>
                    {typeLabels[sensor.type]}
                  </span>
                  <span className="sensor-location">📍 {sensor.location}</span>
                </div>
                <div className="sensor-card-footer">
                  <span className={`sensor-status-badge sensor-status-${sensor.status}`}>
                    {sensor.status === 'active' ? 'Aktivan' : 'Neaktivan'}
                  </span>
                  {sensor.lastReading && (
                    <span className="sensor-last-reading" title="Zadnje očitanje">
                      {sensor.lastReading}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* Tablica (alternativni prikaz za širi pregled) */}
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
                    <td className="sensor-cell-name">{sensor.name}</td>
                    <td>
                      <span className={`sensor-type-badge sensor-type-${sensor.type}`}>
                        {typeLabels[sensor.type]}
                      </span>
                    </td>
                    <td className="sensor-cell-location">{sensor.location}</td>
                    <td className="sensor-cell-reading">{sensor.lastReading ?? '—'}</td>
                    <td>
                      <span className={`sensor-status-badge sensor-status-${sensor.status}`}>
                        {sensor.status === 'active' ? 'Aktivan' : 'Neaktivan'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

export default SensorsPage;

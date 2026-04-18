import { useState } from 'react';
import './AlarmsPage.css';
import { apiFetch } from '../lib/api';
import { useNotifications } from '../contexts/NotificationsContext';
import type { AlarmType } from '../contexts/NotificationsContext';

/* ===== Tipovi ===== */
type FilterType = 'all' | AlarmType;
type FilterStatus = 'all' | 'unread' | 'read';

/* ===== Pomoćne konstante ===== */
const typeLabels: Record<AlarmType, string> = {
  motion:  'Pokret',
  sound:   'Zvuk',
  offline: 'Offline',
  door:    'Vrata',
  temp:    'Temperatura',
};

const formatTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('hr-HR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

/* ===== Komponenta ===== */
function AlarmsPage() {
  const { alarms, isLoading, markAsRead, markAllAsRead, refresh } = useNotifications();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [isSimulating, setIsSimulating] = useState(false);

  /* Simuliraj novi alarm (za testiranje real-time notifikacija) */
  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      await apiFetch('/api/alarms/simulate', {
        method: 'POST',
        includeAuth: true,
        body: JSON.stringify({}),
      });
      // Brzi refresh da korisnik odmah vidi novi alarm, bez čekanja na sljedeći poll tick
      await refresh();
    } finally {
      setIsSimulating(false);
    }
  };

  /* Filtriranje */
  const filtered = alarms.filter((a) => {
    if (filterType !== 'all' && a.type !== filterType) return false;
    if (filterStatus === 'unread' && a.isRead) return false;
    if (filterStatus === 'read' && !a.isRead) return false;
    return true;
  });

  const unreadCount = alarms.filter((a) => !a.isRead).length;

  return (
    <>
      {/* Zaglavlje */}
      <div className="alarms-header">
        <div className="alarms-header-left">
          <h2 className="alarms-title">Alarmi i notifikacije</h2>
          <p className="alarms-subtitle">Pregled svih alarma u sustavu</p>
        </div>
        <div className="alarms-header-right">
          <span className="alarms-stat">
            Ukupno: <strong>{alarms.length}</strong>
          </span>
          <span className="alarms-stat alarms-stat-unread">
            Nepročitano: <strong>{unreadCount}</strong>
          </span>
          <button
            type="button"
            className="alarms-simulate-btn"
            onClick={handleSimulate}
            disabled={isSimulating}
            title="Simulira novi alarm iz backenda (za testiranje)"
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            {isSimulating ? 'Simuliram...' : 'Simuliraj alarm'}
          </button>
          {unreadCount > 0 && (
            <button type="button" className="alarms-mark-all-btn" onClick={() => void markAllAsRead()}>
              Označi sve kao pročitano
            </button>
          )}
        </div>
      </div>

      {/* Filteri */}
      <div className="alarms-filters">
        <div className="alarms-filter-group">
          <span className="alarms-filter-label">Tip:</span>
          {(['all', 'motion', 'sound', 'offline', 'door', 'temp'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`filter-btn ${filterType === t ? 'filter-btn-active' : ''}`}
              onClick={() => setFilterType(t)}
            >
              {t === 'all' ? 'Svi' : typeLabels[t]}
            </button>
          ))}
        </div>
        <div className="alarms-filter-group">
          <span className="alarms-filter-label">Status:</span>
          {(['all', 'unread', 'read'] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`filter-btn ${filterStatus === s ? 'filter-btn-active' : ''}`}
              onClick={() => setFilterStatus(s)}
            >
              {s === 'all' ? 'Svi' : s === 'unread' ? 'Nepročitani' : 'Pročitani'}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="alarms-loading">
          <div className="alarms-loading-spinner" />
          <p>Učitavanje alarma...</p>
        </div>
      )}

      {/* Tablica */}
      {!isLoading && (
        <>
          {filtered.length === 0 ? (
            <div className="alarms-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="alarms-empty-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              <p>Nema alarma za prikaz s trenutnim filterima.</p>
            </div>
          ) : (
            <div className="alarms-table-wrapper">
              <table className="alarms-table">
                <thead>
                  <tr>
                    <th>Tip</th>
                    <th>Kamera</th>
                    <th>Poruka</th>
                    <th>Vrijeme</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((alarm) => (
                    <tr key={alarm.id} className={alarm.isRead ? 'alarm-row-read' : 'alarm-row-unread'}>
                      <td>
                        <span className={`alarm-type-badge alarm-type-${alarm.type}`}>
                          {typeLabels[alarm.type]}
                        </span>
                      </td>
                      <td className="alarm-cell-camera">{alarm.camera}</td>
                      <td className="alarm-cell-message">{alarm.message}</td>
                      <td className="alarm-cell-time">{formatTime(alarm.time)}</td>
                      <td>
                        <span className={`alarm-status-badge ${alarm.isRead ? 'alarm-status-read' : 'alarm-status-unread'}`}>
                          {alarm.isRead ? 'Pročitano' : 'Novo'}
                        </span>
                      </td>
                      <td className="alarm-cell-action">
                        {!alarm.isRead && (
                          <button
                            type="button"
                            className="alarm-read-btn"
                            onClick={() => void markAsRead(alarm.id)}
                          >
                            Označi pročitanim
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default AlarmsPage;

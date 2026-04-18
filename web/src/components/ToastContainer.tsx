import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationsContext';
import type { Toast as ToastType, AlarmType } from '../contexts/NotificationsContext';
import './ToastContainer.css';

const AUTO_DISMISS_MS = 6000;

const typeLabels: Record<AlarmType, string> = {
  motion:  'Pokret',
  sound:   'Zvuk',
  offline: 'Offline',
  door:    'Vrata',
  temp:    'Temperatura',
};

const typeShort: Record<AlarmType, string> = {
  motion:  'MOT',
  sound:   'SND',
  offline: 'OFF',
  door:    'DOR',
  temp:    'TMP',
};

function Toast({ toast }: { toast: ToastType }) {
  const { dismissToast, markAsRead } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => dismissToast(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, dismissToast]);

  const handleClick = () => {
    dismissToast(toast.id);
    navigate('/alarmi');
  };

  const handleMarkRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    void markAsRead(toast.alarm.id);
    dismissToast(toast.id);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissToast(toast.id);
  };

  return (
    <div
      className={`toast toast-type-${toast.alarm.type}`}
      onClick={handleClick}
      role="alert"
    >
      <span className={`toast-badge toast-badge-${toast.alarm.type}`}>
        {typeShort[toast.alarm.type]}
      </span>
      <div className="toast-body">
        <div className="toast-title">
          <span className="toast-type-label">{typeLabels[toast.alarm.type]}</span>
          <span className="toast-camera">{toast.alarm.camera}</span>
        </div>
        <p className="toast-message">{toast.alarm.message}</p>
        <div className="toast-actions">
          <button type="button" className="toast-action-btn toast-action-read" onClick={handleMarkRead}>
            Označi pročitanim
          </button>
          <button type="button" className="toast-action-btn" onClick={handleClick}>
            Otvori alarme
          </button>
        </div>
      </div>
      <button
        type="button"
        className="toast-close"
        onClick={handleDismiss}
        aria-label="Zatvori notifikaciju"
      >
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}

function ToastContainer() {
  const { toasts } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

export default ToastContainer;

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { apiFetch } from '../lib/api';
import { getAuthToken } from '../lib/auth';

/* ===== Tipovi ===== */
export type AlarmType = 'motion' | 'sound' | 'offline' | 'door' | 'temp';

export type Alarm = {
  id: string;
  type: AlarmType;
  camera: string;
  message: string;
  time: string;
  isRead: boolean;
};

export type Toast = {
  id: string;
  alarm: Alarm;
};

type NotificationsContextValue = {
  alarms: Alarm[];
  unreadCount: number;
  isLoading: boolean;
  error: boolean;
  toasts: Toast[];
  dismissToast: (toastId: string) => void;
  markAsRead: (alarmId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

/* ===== Konstante ===== */
const POLL_INTERVAL_MS = 10_000; // 10 sekundi — isto kao web

/* ===== Provider ===== */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ID-jevi alarma koje smo već vidjeli (pratimo kad stigne nova)
  const seenIdsRef = useRef<Set<string>>(new Set());
  // Preskoci toast pri prvom učitavanju (inače bi ih bilo 10 odjednom)
  const isFirstLoadRef = useRef(true);

  const fetchAlarms = useCallback(async () => {
    if (!getAuthToken()) return;

    try {
      const response = await apiFetch('/api/alarms', { includeAuth: true });
      if (!response.ok) {
        setError(true);
        return;
      }

      const data = await response.json();
      const fetched: Alarm[] = data.alarms ?? [];

      if (!isFirstLoadRef.current) {
        // Detektiraj nove nepročitane koji još nisu bili viđeni
        const newOnes = fetched.filter(
          (a) => !a.isRead && !seenIdsRef.current.has(a.id)
        );

        if (newOnes.length > 0) {
          const newToasts: Toast[] = newOnes.map((alarm) => ({
            id: `toast-${alarm.id}-${Date.now()}`,
            alarm,
          }));
          setToasts((prev) => [...prev, ...newToasts]);
        }
      }

      // Ažuriraj praćenje seen ID-jeva
      fetched.forEach((a) => seenIdsRef.current.add(a.id));

      setError(false);
      setAlarms(fetched);
      isFirstLoadRef.current = false;
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* Initial load + polling */
  useEffect(() => {
    setIsLoading(true);
    void fetchAlarms();
    const interval = setInterval(() => {
      void fetchAlarms();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchAlarms]);

  const dismissToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  const markAsRead = useCallback(async (alarmId: string) => {
    // Optimistic
    setAlarms((prev) =>
      prev.map((a) => (a.id === alarmId ? { ...a, isRead: true } : a))
    );
    try {
      const response = await apiFetch(`/api/alarms/${alarmId}/read`, {
        method: 'PATCH',
        includeAuth: true,
      });
      if (!response.ok) void fetchAlarms();
    } catch {
      void fetchAlarms();
    }
  }, [fetchAlarms]);

  const markAllAsRead = useCallback(async () => {
    setAlarms((prev) => prev.map((a) => ({ ...a, isRead: true })));
    try {
      const response = await apiFetch('/api/alarms/read-all', {
        method: 'PATCH',
        includeAuth: true,
      });
      if (!response.ok) void fetchAlarms();
    } catch {
      void fetchAlarms();
    }
  }, [fetchAlarms]);

  const unreadCount = alarms.filter((a) => !a.isRead).length;

  return (
    <NotificationsContext.Provider
      value={{
        alarms,
        unreadCount,
        isLoading,
        error,
        toasts,
        dismissToast,
        markAsRead,
        markAllAsRead,
        refresh: fetchAlarms,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

/* ===== Hook ===== */
export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return ctx;
}

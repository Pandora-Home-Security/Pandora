import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
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
  toasts: Toast[];
  dismissToast: (toastId: string) => void;
  markAsRead: (alarmId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

/* ===== Konstante ===== */
const POLL_INTERVAL_MS = 10_000; // 10 sekundi
const CRITICAL_TYPES: AlarmType[] = ['offline', 'temp'];

/* ===== Zvučni signal (Web Audio API) ===== */
function playBeep(isCritical: boolean) {
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = isCritical ? 880 : 600;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);

    // Kod kritičnih — dvostruki beep
    if (isCritical) {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.value = 880;
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.4);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75);
      osc2.start(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 0.75);
    }
  } catch {
    /* ignoriraj — neki browseri traže user gesture */
  }
}

/* ===== Provider ===== */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ID-jevi alarma koje smo već vidjeli (pratimo kad stigne nova)
  const seenIdsRef = useRef<Set<string>>(new Set());
  // Preskoci toast/zvuk pri prvom učitavanju (inače bi ih bilo 10 odjednom)
  const isFirstLoadRef = useRef(true);

  const fetchAlarms = useCallback(async () => {
    if (!getAuthToken()) return;

    try {
      const response = await apiFetch('/api/alarms', { includeAuth: true });
      if (!response.ok) return;

      const data = await response.json();
      const fetched: Alarm[] = data.alarms ?? [];

      if (!isFirstLoadRef.current) {
        // Detektiraj nove nepročitane koji još nisu bili viđeni
        const newOnes = fetched.filter((a) => !a.isRead && !seenIdsRef.current.has(a.id));

        if (newOnes.length > 0) {
          const newToasts = newOnes.map((alarm) => ({
            id: `toast-${alarm.id}-${Date.now()}`,
            alarm,
          }));
          setToasts((prev) => [...prev, ...newToasts]);

          // Zvuk — ako je bilo koji kritičan, sviraj kritični pattern
          const hasCritical = newOnes.some((a) => CRITICAL_TYPES.includes(a.type));
          playBeep(hasCritical);
        }
      }

      // Ažuriraj praćenje seen ID-jeva
      fetched.forEach((a) => seenIdsRef.current.add(a.id));

      setAlarms(fetched);
      isFirstLoadRef.current = false;
    } catch {
      /* ignoriraj greške pollinga */
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* Initial load + polling */
  useEffect(() => {
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
    const response = await apiFetch(`/api/alarms/${alarmId}/read`, {
      method: 'PATCH',
      includeAuth: true,
    });
    if (response.ok) {
      setAlarms((prev) => prev.map((a) => (a.id === alarmId ? { ...a, isRead: true } : a)));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const response = await apiFetch('/api/alarms/read-all', {
      method: 'PATCH',
      includeAuth: true,
    });
    if (response.ok) {
      setAlarms((prev) => prev.map((a) => ({ ...a, isRead: true })));
    }
  }, []);

  const unreadCount = alarms.filter((a) => !a.isRead).length;

  return (
    <NotificationsContext.Provider
      value={{
        alarms,
        unreadCount,
        isLoading,
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

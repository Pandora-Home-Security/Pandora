import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import { AppScreenLayout } from '../components/AppScreenLayout';
import { SensorFormModal, type SensorFormData } from '../components/SensorFormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { apiFetch } from '../lib/api';
import { clearAuthSession } from '../lib/auth';
import { colors, radius } from '../theme/colors';
import { typography } from '../theme/typography';
import { sensorTypeLabels, sensorTypeColors, type SensorType } from '../data/mockData';
import {
  SensorIcon,
  formatLastReading,
  isOnline,
  relativeTime,
  eventTypeLabels,
} from './SensorsScreen';
import type { RootStackParamList, RootStackNavigation } from '../navigation/RootStack';

type Sensor = {
  id: string;
  name: string;
  type: SensorType;
  location: string;
  status: 'active' | 'inactive';
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

type Props = NativeStackScreenProps<RootStackParamList, 'SensorDetail'>;

function eventBadgeColor(eventType: string): string {
  switch (eventType) {
    case 'alert':
      return colors.error;
    case 'battery_low':
      return '#fb923c';
    case 'offline':
      return colors.textMuted;
    case 'online':
      return colors.success;
    case 'status_change':
      return '#60a5fa';
    case 'reading':
    default:
      return colors.accent;
  }
}

function formatPayload(payload: Record<string, unknown>): string {
  const keys = Object.keys(payload);
  if (keys.length === 0) return '—';
  return keys.map((k) => `${k}: ${JSON.stringify(payload[k])}`).join(', ');
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('hr-HR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function SensorDetailScreen({ route }: Props) {
  const { id } = route.params;
  const navigation = useNavigation<RootStackNavigation>();

  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      setError('');

      try {
        const [sensorRes, eventsRes] = await Promise.all([
          apiFetch(`/api/sensors/${id}`, { includeAuth: true }),
          apiFetch(`/api/sensors/${id}/events?limit=50`, { includeAuth: true }),
        ]);

        if (sensorRes.status === 401) {
          clearAuthSession();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }

        if (sensorRes.status === 404) {
          setError('Senzor nije pronađen.');
          return;
        }

        const sensorData = await sensorRes.json();
        if (!sensorRes.ok) {
          setError(sensorData.message || 'Neuspješno dohvaćanje senzora.');
          return;
        }
        setSensor(sensorData.sensor);

        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setEvents(eventsData.events ?? []);
        }
      } catch {
        setError('Greška pri dohvaćanju senzora.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, navigation]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load(true);
  }, [load]);

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Sensors');
  };

  const handleEditSubmit = async (data: SensorFormData) => {
    const res = await apiFetch(`/api/sensors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      includeAuth: true,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Greška pri ažuriranju.');
    setSensor(json.sensor);
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = async () => {
    const res = await apiFetch(`/api/sensors/${id}`, {
      method: 'DELETE',
      includeAuth: true,
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.message || 'Greška pri brisanju.');
    }
    setIsDeleteOpen(false);
    navigation.navigate('Sensors');
  };

  if (loading) {
    return (
      <AppScreenLayout title="Senzor">
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loaderText}>Učitavanje...</Text>
        </View>
      </AppScreenLayout>
    );
  }

  if (error || !sensor) {
    return (
      <AppScreenLayout title="Senzor">
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || 'Senzor nije dostupan.'}</Text>
          <Pressable onPress={handleBack} style={styles.backFallbackBtn}>
            <Text style={styles.backFallbackText}>Povratak na popis senzora</Text>
          </Pressable>
        </View>
      </AppScreenLayout>
    );
  }

  const online = isOnline(sensor.last_seen);
  const isActive = sensor.status === 'active';
  const typeColor = sensorTypeColors[sensor.type];

  // Za "zadnje očitanje" — uzmi prvi event iz liste (najnoviji prvo)
  const lastEvent = events[0];
  const lastReading = lastEvent
    ? formatLastReading({
        last_event_type: lastEvent.event_type,
        last_event_payload: lastEvent.payload,
      })
    : '—';

  return (
    <AppScreenLayout title={sensor.name}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* Back + CRUD */}
        <View style={styles.topBar}>
          <Pressable onPress={handleBack} hitSlop={8} style={styles.backBtn}>
            <Svg viewBox="0 0 20 20" width={16} height={16} fill={colors.accent}>
              <Path
                fillRule="evenodd"
                d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 011.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                clipRule="evenodd"
              />
            </Svg>
            <Text style={styles.backText}>Natrag na senzore</Text>
          </Pressable>

          <View style={styles.crudActions}>
            <Pressable
              onPress={() => setIsFormOpen(true)}
              style={({ pressed }) => [styles.crudBtn, styles.crudBtnEdit, pressed && styles.crudBtnPressed]}
              hitSlop={4}
            >
              <Svg viewBox="0 0 20 20" width={14} height={14} fill={colors.textPrimary}>
                <Path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
              </Svg>
              <Text style={styles.crudBtnText}>Uredi</Text>
            </Pressable>
            <Pressable
              onPress={() => setIsDeleteOpen(true)}
              style={({ pressed }) => [styles.crudBtn, styles.crudBtnDelete, pressed && styles.crudBtnPressed]}
              hitSlop={4}
            >
              <Svg viewBox="0 0 20 20" width={14} height={14} fill={colors.textPrimary}>
                <Path
                  fillRule="evenodd"
                  d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                  clipRule="evenodd"
                />
              </Svg>
              <Text style={styles.crudBtnText}>Obriši</Text>
            </Pressable>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: typeColor + '1A' }]}>
            <SensorIcon type={sensor.type} size={36} />
          </View>
          <Text style={styles.heroName}>{sensor.name}</Text>
          <View style={styles.heroMeta}>
            <View style={[styles.typeBadge, { backgroundColor: typeColor + '1F' }]}>
              <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                {sensorTypeLabels[sensor.type]}
              </Text>
            </View>
            <View style={styles.locationRow}>
              <Svg viewBox="0 0 20 20" width={12} height={12} fill={colors.textMuted}>
                <Path
                  fillRule="evenodd"
                  d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                  clipRule="evenodd"
                />
              </Svg>
              <Text style={styles.locationText}>{sensor.location}</Text>
            </View>
          </View>
          <View style={styles.pillsRow}>
            <View style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}>
              <View style={[styles.pillDot, { backgroundColor: isActive ? colors.success : colors.textMuted }]} />
              <Text style={[styles.pillText, { color: isActive ? colors.success : colors.textMuted }]}>
                {isActive ? 'Aktivan' : 'Neaktivan'}
              </Text>
            </View>
            <View style={[styles.pill, online ? styles.pillOnline : styles.pillOffline]}>
              <View style={[styles.pillDot, { backgroundColor: online ? colors.success : colors.error }]} />
              <Text style={[styles.pillText, { color: online ? colors.success : colors.error }]}>
                {online ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>

        {/* Brzi info panel */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Informacije</Text>
          <View style={styles.divider} />
          <DetailRow label="Zadnje očitanje" value={lastReading} />
          <DetailRow
            label="Zadnji signal"
            value={sensor.last_seen ? relativeTime(sensor.last_seen) : 'Nikad'}
          />
          <DetailRow label="Kreiran" value={formatDateTime(sensor.created_at)} />
        </View>

        {/* Događaji */}
        <View style={styles.panel}>
          <View style={styles.eventsHeader}>
            <Text style={styles.panelTitle}>Događaji</Text>
            <Text style={styles.eventsCount}>
              {events.length} {events.length === 1 ? 'događaj' : 'događaja'}
            </Text>
          </View>
          <View style={styles.divider} />
          {events.length === 0 && (
            <Text style={styles.emptyEvents}>Nema zabilježenih događaja.</Text>
          )}
          {events.map((ev) => {
            const tone = eventBadgeColor(ev.event_type);
            return (
              <View key={ev.id} style={styles.eventItem}>
                <View style={[styles.eventBadge, { borderColor: tone }]}>
                  <Text style={[styles.eventBadgeText, { color: tone }]} numberOfLines={1}>
                    {eventTypeLabels[ev.event_type] ?? ev.event_type}
                  </Text>
                </View>
                <View style={styles.eventBody}>
                  <Text style={styles.eventPayload} numberOfLines={2}>
                    {formatPayload(ev.payload)}
                  </Text>
                  <Text style={styles.eventTime}>{formatDateTime(ev.created_at)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* CRUD modali */}
      <SensorFormModal
        visible={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleEditSubmit}
        isEdit
        initialData={{
          name: sensor.name,
          type: sensor.type,
          location: sensor.location,
          status: sensor.status,
        }}
      />

      <ConfirmModal
        visible={isDeleteOpen}
        title="Obrisati senzor?"
        message={`Jeste li sigurni da želite obrisati senzor "${sensor.name}"? Svi povezani događaji će također biti obrisani.`}
        confirmText="Obriši"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </AppScreenLayout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bgDeep },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: colors.bgDeep,
  },
  loaderText: {
    ...typography.formSubheader,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.formSubheader,
    color: colors.errorText,
    textAlign: 'center',
  },
  backFallbackBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.button,
    backgroundColor: colors.accent,
  },
  backFallbackText: {
    ...typography.button,
    color: colors.bgDeep,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  backText: {
    ...typography.link,
    color: colors.accent,
  },
  crudActions: {
    flexDirection: 'row',
    gap: 8,
  },
  crudBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.button,
    borderWidth: 1,
  },
  crudBtnEdit: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.borderSubtle,
  },
  crudBtnDelete: {
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
  },
  crudBtnPressed: { opacity: 0.75 },
  crudBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // Hero
  hero: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.card,
    padding: 18,
    alignItems: 'center',
    gap: 10,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    ...typography.formHeader,
    color: colors.textPrimary,
    fontSize: 17,
    textAlign: 'center',
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    ...typography.formSubheader,
    color: colors.textMuted,
    fontSize: 12,
  },

  pillsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: 'rgba(90, 207, 122, 0.1)',
    borderColor: 'rgba(90, 207, 122, 0.25)',
  },
  pillInactive: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderColor: 'rgba(107, 114, 128, 0.2)',
  },
  pillOnline: {
    backgroundColor: 'rgba(90, 207, 122, 0.1)',
    borderColor: 'rgba(90, 207, 122, 0.25)',
  },
  pillOffline: {
    backgroundColor: 'rgba(229, 77, 77, 0.1)',
    borderColor: 'rgba(229, 77, 77, 0.25)',
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Panels
  panel: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.card,
    padding: 16,
  },
  panelTitle: {
    ...typography.formHeader,
    color: colors.textPrimary,
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 12,
  },

  // Detail row
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  detailLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
  detailValue: {
    ...typography.formSubheader,
    color: colors.textPrimary,
    fontWeight: '500',
    maxWidth: '65%',
    textAlign: 'right',
  },

  // Events
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventsCount: {
    ...typography.label,
    color: colors.textMuted,
  },
  emptyEvents: {
    ...typography.formSubheader,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
  },
  eventItem: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  eventBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: colors.bgInput,
    alignSelf: 'flex-start',
    minWidth: 80,
    alignItems: 'center',
  },
  eventBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  eventBody: {
    flex: 1,
    gap: 3,
  },
  eventPayload: {
    ...typography.formSubheader,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  eventTime: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 11,
  },
});

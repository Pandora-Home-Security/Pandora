import { useCallback, useEffect, useMemo, useState } from 'react';
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
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { AppScreenLayout } from '../components/AppScreenLayout';
import { SensorFormModal, type SensorFormData } from '../components/SensorFormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { ApiKeyModal } from '../components/ApiKeyModal';
import { apiFetch } from '../lib/api';
import { clearAuthSession } from '../lib/auth';
import { colors, radius } from '../theme/colors';
import { typography } from '../theme/typography';
import {
  sensorTypeLabels,
  sensorTypeColors,
  type SensorType,
} from '../data/mockData';
import type { RootStackNavigation } from '../navigation/RootStack';

/* ===== Tipovi ===== */
type SensorStatus = 'active' | 'inactive';

export type Sensor = {
  id: string;
  name: string;
  type: SensorType;
  location: string;
  status: SensorStatus;
  last_seen: string | null;
  created_at: string;
  last_event_type: string | null;
  last_event_payload: Record<string, unknown> | null;
  last_event_time: string | null;
};

type FilterType = 'all' | SensorType;
type FilterStatus = 'all' | SensorStatus;
type FilterConnection = 'all' | 'online' | 'offline';

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

export function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_THRESHOLD_MS;
}

export function formatLastReading(sensor: {
  last_event_type: string | null;
  last_event_payload: Record<string, unknown> | null;
}): string {
  if (!sensor.last_event_payload || !sensor.last_event_type) return '—';
  const p = sensor.last_event_payload;
  if (p.temperature !== undefined) {
    const temp = `${p.temperature} °C`;
    return p.humidity !== undefined ? `${temp} / ${p.humidity}%` : temp;
  }
  if (p.state !== undefined) return String(p.state) === 'open' ? 'Otvoreno' : 'Zatvoreno';
  if (p.smoke_level !== undefined) return Number(p.smoke_level) > 0.5 ? 'Dim detektiran!' : 'OK';
  if (p.motion !== undefined) return p.motion ? 'Pokret!' : 'Mirno';
  if (p.level !== undefined) return `Baterija: ${p.level}%`;
  if (p.message !== undefined) return String(p.message);
  return eventTypeLabels[sensor.last_event_type] ?? '—';
}

export function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'Upravo';
  const min = Math.floor(sec / 60);
  if (min < 60) return `Prije ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `Prije ${hrs}h`;
  return new Date(dateStr).toLocaleDateString('hr-HR');
}

export const eventTypeLabels: Record<string, string> = {
  reading: 'Očitanje',
  alert: 'Upozorenje',
  status_change: 'Promjena statusa',
  battery_low: 'Slaba baterija',
  offline: 'Offline',
  online: 'Online',
};

/* ===== Ikona po tipu ===== */
export function SensorIcon({ type, size = 20 }: { type: SensorType; size?: number }) {
  const color = sensorTypeColors[type];
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 24 24' as const,
    fill: 'none' as const,
    stroke: color,
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (type) {
    case 'door':
      return (
        <Svg {...p}>
          <Path d="M4 20h16" />
          <Path d="M6 20V4h12v16" />
          <Circle cx={15} cy={12} r={0.8} fill={color} stroke="none" />
        </Svg>
      );
    case 'window':
      return (
        <Svg {...p}>
          <Rect x={4} y={4} width={16} height={16} rx={1.5} />
          <Path d="M4 12h16M12 4v16" />
        </Svg>
      );
    case 'smoke':
      return (
        <Svg {...p}>
          <Path d="M5 18c0-1.5 1-2 2-2s2 .5 2 2" />
          <Path d="M9 14c0-1.5 1.2-2.3 2.5-2.3s2.5.8 2.5 2.3" />
          <Path d="M13 10c0-1.8 1.3-2.8 3-2.8s3 1 3 2.8" />
          <Path d="M3 21h18" />
        </Svg>
      );
    case 'temperature':
      return (
        <Svg {...p}>
          <Path d="M14 14.76V5a2 2 0 1 0-4 0v9.76a4 4 0 1 0 4 0z" />
          <Line x1={12} y1={9} x2={12} y2={15} />
        </Svg>
      );
    case 'motion':
      return (
        <Svg {...p}>
          <Circle cx={12} cy={5} r={1.6} />
          <Path d="M10 22l2-6 2 6" />
          <Path d="M8 12l4-3 4 3-2 4h-4z" />
          <Path d="M6 10l-2 2M18 10l2 2" />
        </Svg>
      );
  }
}

const typeFilterOptions: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Svi' },
  { key: 'door', label: 'Vrata' },
  { key: 'window', label: 'Prozor' },
  { key: 'smoke', label: 'Dim' },
  { key: 'temperature', label: 'Temp.' },
  { key: 'motion', label: 'Pokret' },
];

const statusFilterOptions: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'Svi' },
  { key: 'active', label: 'Aktivni' },
  { key: 'inactive', label: 'Neaktivni' },
];

const connectionFilterOptions: { key: FilterConnection; label: string }[] = [
  { key: 'all', label: 'Svi' },
  { key: 'online', label: 'Online' },
  { key: 'offline', label: 'Offline' },
];

export function SensorsScreen() {
  const navigation = useNavigation<RootStackNavigation>();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterConnection, setFilterConnection] = useState<FilterConnection>('all');

  // CRUD modali
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);
  const [deletingSensor, setDeletingSensor] = useState<Sensor | null>(null);
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);

  const fetchSensors = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      setError('');
      try {
        const res = await apiFetch('/api/sensors', { includeAuth: true });

        if (res.status === 401) {
          clearAuthSession();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }

        const data = await res.json();
        if (!res.ok) {
          setError(data.message || 'Neuspješno dohvaćanje senzora.');
          return;
        }
        setSensors(data.sensors ?? []);
      } catch {
        setError('Greška pri dohvaćanju senzora.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigation]
  );

  useEffect(() => {
    void fetchSensors();
  }, [fetchSensors]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchSensors(true);
  }, [fetchSensors]);

  const handleAdd = () => {
    setEditingSensor(null);
    setIsFormOpen(true);
  };

  const handleEdit = (sensor: Sensor) => {
    setEditingSensor(sensor);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: SensorFormData) => {
    if (editingSensor) {
      const res = await apiFetch(`/api/sensors/${editingSensor.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        includeAuth: true,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Greška pri ažuriranju.');
      setIsFormOpen(false);
      setEditingSensor(null);
      await fetchSensors(true);
    } else {
      const res = await apiFetch('/api/sensors', {
        method: 'POST',
        body: JSON.stringify(data),
        includeAuth: true,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Greška pri dodavanju.');
      setIsFormOpen(false);
      setCreatedApiKey(json.sensor?.api_key ?? null);
      await fetchSensors(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSensor) return;
    const res = await apiFetch(`/api/sensors/${deletingSensor.id}`, {
      method: 'DELETE',
      includeAuth: true,
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.message || 'Greška pri brisanju.');
    }
    setDeletingSensor(null);
    await fetchSensors(true);
  };

  const filtered = useMemo(
    () =>
      sensors.filter((s) => {
        if (filterType !== 'all' && s.type !== filterType) return false;
        if (filterStatus !== 'all' && s.status !== filterStatus) return false;
        if (filterConnection !== 'all') {
          const online = isOnline(s.last_seen);
          if (filterConnection === 'online' && !online) return false;
          if (filterConnection === 'offline' && online) return false;
        }
        return true;
      }),
    [sensors, filterType, filterStatus, filterConnection]
  );

  const activeCount = sensors.filter((s) => s.status === 'active').length;
  const inactiveCount = sensors.length - activeCount;
  const onlineCount = sensors.filter((s) => isOnline(s.last_seen)).length;
  const offlineCount = sensors.length - onlineCount;

  return (
    <AppScreenLayout title="Senzori">
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
        {/* Intro */}
        <View style={styles.intro}>
          <Text style={styles.title}>IoT Senzori</Text>
          <Text style={styles.subtitle}>Pregled i upravljanje senzorima u sustavu</Text>
        </View>

        {/* Dodaj senzor */}
        <Pressable
          onPress={handleAdd}
          style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
        >
          <Svg viewBox="0 0 20 20" width={16} height={16} fill={colors.bgDeep}>
            <Path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </Svg>
          <Text style={styles.addBtnText}>Dodaj senzor</Text>
        </Pressable>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Ukupno</Text>
            <Text style={styles.statValue}>{sensors.length}</Text>
          </View>
          <View style={[styles.statPill, styles.statPillOnline]}>
            <Text style={[styles.statLabel, styles.statLabelOnline]}>Online</Text>
            <Text style={[styles.statValue, styles.statValueOnline]}>{onlineCount}</Text>
          </View>
          <View style={[styles.statPill, styles.statPillOffline]}>
            <Text style={[styles.statLabel, styles.statLabelOffline]}>Offline</Text>
            <Text style={[styles.statValue, styles.statValueOffline]}>{offlineCount}</Text>
          </View>
        </View>

        <View style={styles.statsSecondary}>
          <Text style={styles.statsSecondaryText}>
            Aktivni: <Text style={styles.statsSecondaryActive}>{activeCount}</Text>  ·  Neaktivni:{' '}
            <Text style={styles.statsSecondaryInactive}>{inactiveCount}</Text>
          </Text>
        </View>

        {/* Filteri */}
        <View style={styles.filtersCard}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>Tip</Text>
            <View style={styles.filterRow}>
              {typeFilterOptions.map((opt) => (
                <FilterChip
                  key={opt.key}
                  label={opt.label}
                  active={filterType === opt.key}
                  onPress={() => setFilterType(opt.key)}
                />
              ))}
            </View>
          </View>
          <View style={styles.filterDivider} />
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>Status</Text>
            <View style={styles.filterRow}>
              {statusFilterOptions.map((opt) => (
                <FilterChip
                  key={opt.key}
                  label={opt.label}
                  active={filterStatus === opt.key}
                  onPress={() => setFilterStatus(opt.key)}
                />
              ))}
            </View>
          </View>
          <View style={styles.filterDivider} />
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>Veza</Text>
            <View style={styles.filterRow}>
              {connectionFilterOptions.map((opt) => (
                <FilterChip
                  key={opt.key}
                  label={opt.label}
                  active={filterConnection === opt.key}
                  onPress={() => setFilterConnection(opt.key)}
                />
              ))}
            </View>
          </View>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.loaderText}>Učitavanje senzora...</Text>
          </View>
        )}

        {!loading && !error && filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nema senzora za prikaz s trenutnim filterima.</Text>
          </View>
        )}

        {!loading && filtered.length > 0 && (
          <View style={styles.grid}>
            {filtered.map((sensor) => {
              const typeColor = sensorTypeColors[sensor.type];
              const isActive = sensor.status === 'active';
              const online = isOnline(sensor.last_seen);

              return (
                <Pressable
                  key={sensor.id}
                  onPress={() => navigation.navigate('SensorDetail', { id: sensor.id })}
                  style={({ pressed }) => [
                    styles.card,
                    !isActive && styles.cardInactive,
                    pressed && styles.cardPressed,
                  ]}
                >
                  {/* Card header */}
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconWrap, { backgroundColor: typeColor + '1A' }]}>
                      <SensorIcon type={sensor.type} />
                    </View>

                    <View style={styles.cardActions}>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleEdit(sensor);
                        }}
                        hitSlop={6}
                        style={({ pressed }) => [
                          styles.cardActionBtn,
                          pressed && styles.cardActionBtnPressed,
                        ]}
                      >
                        <Svg viewBox="0 0 20 20" width={14} height={14} fill={colors.textPrimary}>
                          <Path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                        </Svg>
                      </Pressable>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          setDeletingSensor(sensor);
                        }}
                        hitSlop={6}
                        style={({ pressed }) => [
                          styles.cardActionBtn,
                          styles.cardActionBtnDelete,
                          pressed && styles.cardActionBtnPressed,
                        ]}
                      >
                        <Svg viewBox="0 0 20 20" width={14} height={14} fill={colors.textPrimary}>
                          <Path
                            fillRule="evenodd"
                            d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                            clipRule="evenodd"
                          />
                        </Svg>
                      </Pressable>
                    </View>
                  </View>

                  {/* Card body */}
                  <View style={styles.cardBody}>
                    <Text style={styles.cardName}>{sensor.name}</Text>
                    <View style={styles.cardMeta}>
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
                        <Text style={styles.locationText} numberOfLines={1}>
                          {sensor.location}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Pills row */}
                  <View style={styles.pillsRow}>
                    <View
                      style={[
                        styles.pill,
                        isActive ? styles.pillActive : styles.pillInactive,
                      ]}
                    >
                      <View
                        style={[
                          styles.pillDot,
                          { backgroundColor: isActive ? colors.success : colors.textMuted },
                        ]}
                      />
                      <Text
                        style={[
                          styles.pillText,
                          { color: isActive ? colors.success : colors.textMuted },
                        ]}
                      >
                        {isActive ? 'Aktivan' : 'Neaktivan'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.pill,
                        online ? styles.pillOnline : styles.pillOffline,
                      ]}
                    >
                      <View
                        style={[
                          styles.pillDot,
                          { backgroundColor: online ? colors.success : colors.error },
                        ]}
                      />
                      <Text
                        style={[
                          styles.pillText,
                          { color: online ? colors.success : colors.error },
                        ]}
                      >
                        {online ? 'Online' : 'Offline'}
                      </Text>
                    </View>
                  </View>

                  {/* Footer — zadnje očitanje */}
                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.readingLabel}>Zadnje očitanje</Text>
                      <Text style={styles.readingValue}>{formatLastReading(sensor)}</Text>
                    </View>
                    {sensor.last_seen && (
                      <Text style={styles.lastSeen}>{relativeTime(sensor.last_seen)}</Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modali */}
      <SensorFormModal
        visible={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingSensor(null);
        }}
        onSubmit={handleFormSubmit}
        isEdit={!!editingSensor}
        initialData={
          editingSensor
            ? {
                name: editingSensor.name,
                type: editingSensor.type,
                location: editingSensor.location,
                status: editingSensor.status,
              }
            : null
        }
      />

      <ConfirmModal
        visible={!!deletingSensor}
        title="Obrisati senzor?"
        message={`Jeste li sigurni da želite obrisati senzor "${deletingSensor?.name ?? ''}"? Svi povezani događaji će također biti obrisani.`}
        confirmText="Obriši"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingSensor(null)}
      />

      <ApiKeyModal
        visible={!!createdApiKey}
        apiKey={createdApiKey}
        onClose={() => setCreatedApiKey(null)}
      />
    </AppScreenLayout>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterBtn,
        active && styles.filterBtnActive,
        pressed && !active && styles.filterBtnPressed,
      ]}
    >
      <Text style={[styles.filterBtnText, active && styles.filterBtnTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bgDeep },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  intro: { gap: 2 },
  title: {
    ...typography.formHeader,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.formSubheader,
    color: colors.textMuted,
  },

  // Dodaj gumb
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.button,
    backgroundColor: colors.accent,
  },
  addBtnPressed: { opacity: 0.85 },
  addBtnText: {
    ...typography.button,
    color: colors.bgDeep,
  },

  // Stats
  stats: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.input,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statPillOnline: {
    borderColor: colors.successBorder,
    backgroundColor: colors.successBg,
  },
  statPillOffline: {
    borderColor: colors.errorBorder,
    backgroundColor: colors.errorBg,
  },
  statLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  statLabelOnline: { color: colors.successText },
  statLabelOffline: { color: colors.errorText },
  statValue: {
    ...typography.formHeader,
    color: colors.textPrimary,
    fontSize: 18,
    marginTop: 2,
  },
  statValueOnline: { color: colors.successText },
  statValueOffline: { color: colors.errorText },

  statsSecondary: {
    alignItems: 'center',
  },
  statsSecondaryText: {
    ...typography.label,
    color: colors.textMuted,
  },
  statsSecondaryActive: { color: colors.success, fontWeight: '700' },
  statsSecondaryInactive: { color: colors.textMuted, fontWeight: '700' },

  // Filteri
  filtersCard: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.card,
    padding: 14,
    gap: 10,
  },
  filterGroup: { gap: 8 },
  filterGroupLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  filterBtnActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentGlow,
  },
  filterBtnPressed: {
    backgroundColor: colors.bgInput,
  },
  filterBtnText: {
    ...typography.formSubheader,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterBtnTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },

  // States
  errorBox: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: radius.input,
    padding: 12,
  },
  errorText: {
    ...typography.alert,
    color: colors.errorText,
  },
  loader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  loaderText: {
    ...typography.formSubheader,
    color: colors.textSecondary,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.formSubheader,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // Cards
  grid: { gap: 12 },
  card: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.card,
    padding: 14,
    gap: 12,
  },
  cardInactive: { opacity: 0.7 },
  cardPressed: {
    borderColor: colors.accent,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  cardActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardActionBtnDelete: {
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
  },
  cardActionBtnPressed: { opacity: 0.7 },

  cardBody: { gap: 8 },
  cardName: {
    ...typography.formSubheader,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
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
    flexShrink: 1,
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

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  readingLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  readingValue: {
    ...typography.formSubheader,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
    marginTop: 2,
  },
  lastSeen: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 11,
  },
});

import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, radius } from '../theme/colors';
import { typography } from '../theme/typography';
import { StatCard } from '../components/StatCard';
import { AppScreenLayout } from '../components/AppScreenLayout';
import { apiFetch } from '../lib/api';
import { clearAuthSession } from '../lib/auth';
import { LoadingState, ErrorState, EmptyState } from '../components/DataStates';
import {
  mockAlarms,
  alarmTypeBadge,
} from '../data/mockData';
import { isOnline as sensorIsOnline } from './SensorsScreen';
import type { RootStackNavigation } from '../navigation/RootStack';

type Camera = {
  id: string;
  name: string;
  location: string;
  isOnline: boolean;
};

type DashboardSensor = {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  last_seen: string | null;
};

export function DashboardScreen() {
  const rootNav = useNavigation<RootStackNavigation>();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [sensors, setSensors] = useState<DashboardSensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');

    try {
      const [camRes, senRes] = await Promise.all([
        apiFetch('/api/cameras', { includeAuth: true }),
        apiFetch('/api/sensors', { includeAuth: true }),
      ]);

      if (camRes.status === 401 || senRes.status === 401) {
        clearAuthSession();
        rootNav.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }

      if (camRes.ok) {
        const camData = await camRes.json();
        setCameras(camData.cameras ?? []);
      }

      if (senRes.ok) {
        const senData = await senRes.json();
        setSensors(senData.sensors ?? []);
      }

      if (!camRes.ok || !senRes.ok) {
        setError('Greška pri dohvaćanju podataka.');
      }
    } catch {
      setError('Greška pri dohvaćanju zaštićenih podataka.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rootNav]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadData(true);
  }, [loadData]);

  const activeCameras = cameras.filter((c) => c.isOnline).length;
  const activeSensors = sensors.filter((s) => s.status === 'active').length;
  const inactiveSensors = sensors.length - activeSensors;
  const unreadAlarms = mockAlarms.length;
  const lastFiveAlarms = mockAlarms.slice(0, 5);

  if (loading) {
    return (
      <AppScreenLayout title="Dashboard">
        <LoadingState message="Učitavanje nadzorne ploče..." />
      </AppScreenLayout>
    );
  }

  if (error) {
    return (
      <AppScreenLayout title="Dashboard">
        <ErrorState message={error} onRetry={() => void loadData()} />
      </AppScreenLayout>
    );
  }

  return (
    <AppScreenLayout title="Dashboard">
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
      {/* Stat kartice */}
      <View style={styles.statsGrid}>
        <StatCard
          variant="cameras"
          label="Aktivne kamere"
          value={`${activeCameras}/${cameras.length}`}
        />
        <StatCard
          variant="sensors"
          label="Aktivni senzori"
          value={`${activeSensors}/${sensors.length}`}
        />
        <StatCard
          variant="alarms"
          label="Nepročitani alarmi"
          value={String(unreadAlarms)}
        />
      </View>

      {/* Zadnjih 5 alarma */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Zadnjih 5 alarma</Text>
        <View style={styles.divider} />
        {lastFiveAlarms.map((alarm) => {
          const cfg = alarmTypeBadge[alarm.type];
          return (
            <View key={alarm.id} style={styles.alarmItem}>
              <View style={[styles.alarmBadge, { borderColor: cfg.color }]}>
                <Text style={[styles.alarmBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
              <View style={styles.alarmInfo}>
                <Text style={styles.alarmMessage} numberOfLines={2}>
                  {alarm.message}
                </Text>
                <Text style={styles.alarmTime}>{alarm.time}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Brzi status senzora */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Status senzora</Text>
        <View style={styles.divider} />
        <View style={styles.sensorSummary}>
          <Text style={[styles.sensorSummaryItem, styles.summaryActive]}>
            Aktivni: {activeSensors}
          </Text>
          <Text style={styles.summaryDivider}>|</Text>
          <Text style={[styles.sensorSummaryItem, styles.summaryInactive]}>
            Neaktivni: {inactiveSensors}
          </Text>
        </View>
        {sensors.length === 0 && (
          <Text style={styles.emptyText}>Nema senzora za prikaz.</Text>
        )}
        {sensors.map((sensor) => {
          const online = sensorIsOnline(sensor.last_seen);
          const isActive = sensor.status === 'active';
          return (
            <View key={sensor.id} style={styles.sensorItem}>
              <View
                style={[
                  styles.sensorDot,
                  {
                    backgroundColor: isActive
                      ? online
                        ? colors.success
                        : colors.error
                      : colors.textMuted,
                  },
                ]}
              />
              <Text style={styles.sensorName} numberOfLines={1}>
                {sensor.name}
              </Text>
              <Text
                style={[
                  styles.sensorStatus,
                  {
                    color: isActive
                      ? online
                        ? colors.success
                        : colors.error
                      : colors.textMuted,
                  },
                ]}
              >
                {isActive ? (online ? 'Online' : 'Offline') : 'Neaktivan'}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Kamere — grid (1 stupac na mobile, prirodno) */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Kamere</Text>
        <View style={styles.divider} />
        {cameras.length === 0 ? (
          <Text style={styles.emptyText}>Nema kamera za prikaz.</Text>
        ) : (
          <View style={styles.cameraGrid}>
            {cameras.map((camera) => (
              <View key={camera.id} style={styles.cameraCard}>
                <View
                  style={[
                    styles.cameraIcon,
                    {
                      borderColor: camera.isOnline ? colors.success : colors.textMuted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cameraIconText,
                      { color: camera.isOnline ? colors.success : colors.textMuted },
                    ]}
                  >
                    {camera.isOnline ? 'CAM' : 'OFF'}
                  </Text>
                </View>
                <Text style={styles.cameraName} numberOfLines={1}>
                  {camera.name}
                </Text>
                <Text style={styles.cameraMeta} numberOfLines={1}>
                  Lokacija: {camera.location}
                </Text>
                <Text
                  style={[
                    styles.cameraStatus,
                    { color: camera.isOnline ? colors.success : colors.textMuted },
                  ]}
                >
                  {camera.isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
    </AppScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
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
  alarmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  alarmBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alarmBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  alarmInfo: {
    flex: 1,
    minWidth: 0,
  },
  alarmMessage: {
    ...typography.formSubheader,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  alarmTime: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: 2,
  },
  sensorSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    marginBottom: 6,
  },
  sensorSummaryItem: {
    ...typography.formSubheader,
    fontWeight: '600',
  },
  summaryActive: {
    color: colors.success,
  },
  summaryInactive: {
    color: colors.textMuted,
  },
  summaryDivider: {
    color: colors.borderHover,
  },
  sensorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  sensorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sensorName: {
    ...typography.formSubheader,
    color: colors.textPrimary,
    flex: 1,
  },
  sensorStatus: {
    ...typography.label,
    fontWeight: '600',
  },
  loaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  loaderText: {
    ...typography.formSubheader,
    color: colors.textSecondary,
  },
  emptyText: {
    ...typography.formSubheader,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
  },
  cameraGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cameraCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.input,
    padding: 12,
    gap: 4,
  },
  cameraIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  cameraIconText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cameraName: {
    ...typography.formSubheader,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  cameraMeta: {
    ...typography.label,
    color: colors.textMuted,
  },
  cameraStatus: {
    ...typography.label,
    fontWeight: '600',
    marginTop: 2,
  },
});

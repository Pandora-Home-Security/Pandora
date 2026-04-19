import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, radius } from '../theme/colors';
import { typography } from '../theme/typography';
import { StatCard } from '../components/StatCard';
import { AppScreenLayout } from '../components/AppScreenLayout';
import { apiFetch } from '../lib/api';
import { clearAuthSession } from '../lib/auth';
import {
  mockAlarms,
  mockSensors,
  alarmTypeBadge,
} from '../data/mockData';
import type { RootStackNavigation } from '../navigation/RootStack';

type Camera = {
  id: string;
  name: string;
  location: string;
  isOnline: boolean;
};

export function DashboardScreen() {
  const rootNav = useNavigation<RootStackNavigation>();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadCameras = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/cameras', { includeAuth: true });

      if (response.status === 401) {
        clearAuthSession();
        rootNav.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Neuspješno dohvaćanje kamera.');
        return;
      }
      setCameras(data.cameras ?? []);
    } catch {
      setError('Greška pri dohvaćanju zaštićenih podataka.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rootNav]);

  useEffect(() => {
    void loadCameras();
  }, [loadCameras]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadCameras(true);
  }, [loadCameras]);

  const activeCameras = cameras.filter((c) => c.isOnline).length;
  const activeSensors = mockSensors.filter((s) => s.status === 'active').length;
  const inactiveSensors = mockSensors.length - activeSensors;
  const unreadAlarms = mockAlarms.length;
  const lastFiveAlarms = mockAlarms.slice(0, 5);

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
      {/* Stat kartice — vertikalno na mobitelu (1 stupac na uskim, 3 na sirim) */}
      <View style={styles.statsGrid}>
        <StatCard
          variant="cameras"
          label="Aktivne kamere"
          value={loading ? '...' : `${activeCameras}/${cameras.length}`}
        />
        <StatCard
          variant="sensors"
          label="Aktivni senzori"
          value={`${activeSensors}/${mockSensors.length}`}
        />
        <StatCard
          variant="alarms"
          label="Nepročitani alarmi"
          value={String(unreadAlarms)}
        />
      </View>

      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

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
        {mockSensors.map((sensor) => (
          <View key={sensor.id} style={styles.sensorItem}>
            <View
              style={[
                styles.sensorDot,
                {
                  backgroundColor:
                    sensor.status === 'active' ? colors.success : colors.textMuted,
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
                  color: sensor.status === 'active' ? colors.success : colors.textMuted,
                },
              ]}
            >
              {sensor.status === 'active' ? 'Aktivan' : 'Neaktivan'}
            </Text>
          </View>
        ))}
      </View>

      {/* Kamere — grid (1 stupac na mobile, prirodno) */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Kamere</Text>
        <View style={styles.divider} />
        {loading && (
          <View style={styles.loaderBox}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.loaderText}>Učitavanje kamera...</Text>
          </View>
        )}
        {!loading && !error && cameras.length === 0 && (
          <Text style={styles.emptyText}>Nema kamera za prikaz.</Text>
        )}
        {!loading && cameras.length > 0 && (
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

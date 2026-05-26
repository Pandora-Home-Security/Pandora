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
import Svg, { Path } from 'react-native-svg';
import { AppScreenLayout } from '../components/AppScreenLayout';
import { CameraFormModal, type CameraFormData } from '../components/CameraFormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { apiFetch } from '../lib/api';
import { clearAuthSession } from '../lib/auth';
import { colors, radius } from '../theme/colors';
import { typography } from '../theme/typography';
import type { RootStackNavigation } from '../navigation/RootStack';

type Camera = {
  id: string;
  name: string;
  location: string;
  isOnline: boolean;
  resolution: string;
  lastSeen: string;
  ip: string;
};

type FilterStatus = 'all' | 'online' | 'offline';

function formatLastSeen(isoDate: string) {
  try {
    const d = new Date(isoDate);
    return d.toLocaleString('hr-HR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoDate;
  }
}

export function CamerasScreen() {
  const navigation = useNavigation<RootStackNavigation>();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');

  // CRUD modali
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [deletingCamera, setDeletingCamera] = useState<Camera | null>(null);

  const loadCameras = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      setError('');

      try {
        const res = await apiFetch('/api/cameras', { includeAuth: true });

        if (res.status === 401) {
          clearAuthSession();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }

        const data = await res.json();
        if (!res.ok) {
          setError(data.message || 'Neuspješno dohvaćanje kamera.');
          return;
        }
        setCameras(data.cameras ?? []);
      } catch {
        setError('Greška pri dohvaćanju podataka o kamerama.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigation]
  );

  useEffect(() => {
    void loadCameras();
  }, [loadCameras]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadCameras(true);
  }, [loadCameras]);

  const handleAdd = () => {
    setEditingCamera(null);
    setIsFormOpen(true);
  };

  const handleEdit = (camera: Camera) => {
    setEditingCamera(camera);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: CameraFormData) => {
    if (editingCamera) {
      const res = await apiFetch(`/api/cameras/${editingCamera.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        includeAuth: true,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Greška pri ažuriranju.');
    } else {
      const res = await apiFetch('/api/cameras', {
        method: 'POST',
        body: JSON.stringify(data),
        includeAuth: true,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Greška pri dodavanju.');
    }

    setIsFormOpen(false);
    setEditingCamera(null);
    await loadCameras(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCamera) return;
    const res = await apiFetch(`/api/cameras/${deletingCamera.id}`, {
      method: 'DELETE',
      includeAuth: true,
    });
    if (!res.ok) {
      const result = await res.json();
      throw new Error(result.message || 'Greška pri brisanju.');
    }
    setDeletingCamera(null);
    await loadCameras(true);
  };

  const onlineCount = cameras.filter((c) => c.isOnline).length;
  const offlineCount = cameras.length - onlineCount;

  const filtered = cameras.filter((c) => {
    if (filter === 'online') return c.isOnline;
    if (filter === 'offline') return !c.isOnline;
    return true;
  });

  return (
    <AppScreenLayout title="Kamere">
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
          <Text style={styles.title}>Kamere</Text>
          <Text style={styles.subtitle}>Pregled svih kamera u sustavu</Text>
        </View>

        {/* Dodaj kameru */}
        <Pressable
          onPress={handleAdd}
          style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
        >
          <Svg viewBox="0 0 20 20" width={16} height={16} fill={colors.bgDeep}>
            <Path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </Svg>
          <Text style={styles.addBtnText}>Dodaj kameru</Text>
        </Pressable>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Ukupno</Text>
            <Text style={styles.statValue}>{cameras.length}</Text>
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

        {/* Filteri */}
        <View style={styles.filters}>
          <FilterBtn
            label={`Sve (${cameras.length})`}
            active={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <FilterBtn
            label={`Online (${onlineCount})`}
            active={filter === 'online'}
            onPress={() => setFilter('online')}
            tone="online"
          />
          <FilterBtn
            label={`Offline (${offlineCount})`}
            active={filter === 'offline'}
            onPress={() => setFilter('offline')}
            tone="offline"
          />
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.loaderText}>Učitavanje kamera...</Text>
          </View>
        )}

        {!loading && !error && filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nema kamera za prikaz s trenutnim filterom.</Text>
          </View>
        )}

        {!loading && filtered.length > 0 && (
          <View style={styles.grid}>
            {filtered.map((camera) => (
              <Pressable
                key={camera.id}
                onPress={() => navigation.navigate('CameraDetail', { id: camera.id })}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              >
                {/* Thumbnail */}
                <View
                  style={[
                    styles.thumb,
                    camera.isOnline ? styles.thumbOnline : styles.thumbOffline,
                  ]}
                >
                  <Svg
                    viewBox="0 0 24 24"
                    width={56}
                    height={56}
                    fill="none"
                    stroke={camera.isOnline ? colors.accent : colors.textMuted}
                    strokeWidth={1.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.55}
                  >
                    <Path d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </Svg>

                  {camera.isOnline ? (
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                  ) : (
                    <View style={styles.offlineBadge}>
                      <Text style={styles.offlineText}>OFFLINE</Text>
                    </View>
                  )}

                  {/* CRUD akcije na kartici */}
                  <View style={styles.cardActions}>
                    <Pressable
                      onPress={() => handleEdit(camera)}
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
                      onPress={() => setDeletingCamera(camera)}
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

                {/* Info */}
                <View style={styles.info}>
                  <View style={styles.infoTop}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {camera.name}
                    </Text>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: camera.isOnline ? colors.success : colors.textMuted },
                      ]}
                    />
                  </View>
                  <View style={styles.metaRow}>
                    <Svg viewBox="0 0 20 20" width={12} height={12} fill={colors.textMuted}>
                      <Path
                        fillRule="evenodd"
                        d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                        clipRule="evenodd"
                      />
                    </Svg>
                    <Text style={styles.metaText} numberOfLines={1}>
                      {camera.location}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Svg viewBox="0 0 20 20" width={12} height={12} fill={colors.textMuted}>
                      <Path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                        clipRule="evenodd"
                      />
                    </Svg>
                    <Text style={styles.metaText} numberOfLines={1}>
                      {formatLastSeen(camera.lastSeen)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modali */}
      <CameraFormModal
        visible={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCamera(null);
        }}
        onSubmit={handleFormSubmit}
        isEdit={!!editingCamera}
        initialData={
          editingCamera
            ? { name: editingCamera.name, location: editingCamera.location, streamUrl: '' }
            : null
        }
      />

      <ConfirmModal
        visible={!!deletingCamera}
        title="Obrisati kameru?"
        message={`Jeste li sigurni da želite obrisati kameru "${deletingCamera?.name ?? ''}"? Ova akcija se ne može poništiti.`}
        confirmText="Obriši"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingCamera(null)}
      />
    </AppScreenLayout>
  );
}

type FilterBtnProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  tone?: 'online' | 'offline';
};

function FilterBtn({ label, active, onPress, tone }: FilterBtnProps) {
  const activeColor =
    tone === 'online' ? colors.success : tone === 'offline' ? colors.error : colors.accent;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterBtn,
        active && { backgroundColor: activeColor, borderColor: activeColor },
        pressed && !active && styles.filterBtnPressed,
      ]}
    >
      <Text
        style={[
          styles.filterText,
          active && { color: colors.bgDeep, fontWeight: '700' },
        ]}
      >
        {label}
      </Text>
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
  intro: {
    gap: 2,
  },
  title: {
    ...typography.formHeader,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.formSubheader,
    color: colors.textMuted,
  },
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
  cardActions: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 6,
  },
  cardActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardActionBtnDelete: {
    backgroundColor: 'rgba(229,77,77,0.65)',
    borderColor: colors.errorBorder,
  },
  cardActionBtnPressed: {
    opacity: 0.75,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgSurface,
  },
  filterBtnPressed: {
    backgroundColor: colors.bgInput,
  },
  filterText: {
    ...typography.label,
    color: colors.textSecondary,
    fontWeight: '500',
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
  grid: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  cardPressed: {
    borderColor: colors.accent,
    opacity: 0.92,
  },
  thumb: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgDeep,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  thumbOnline: {
    backgroundColor: '#0b1220',
  },
  thumbOffline: {
    backgroundColor: '#18181b',
  },
  liveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.error,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textPrimary,
  },
  liveText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  offlineBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  offlineText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  info: {
    padding: 12,
    gap: 6,
  },
  infoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardName: {
    ...typography.formHeader,
    color: colors.textPrimary,
    fontSize: 16,
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    ...typography.label,
    color: colors.textMuted,
    flex: 1,
  },
});

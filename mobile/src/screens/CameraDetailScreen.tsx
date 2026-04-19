import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import { AppScreenLayout } from '../components/AppScreenLayout';
import { apiFetch } from '../lib/api';
import { clearAuthSession } from '../lib/auth';
import { colors, radius } from '../theme/colors';
import { typography } from '../theme/typography';
import type { RootStackParamList, RootStackNavigation } from '../navigation/RootStack';

type Camera = {
  id: string;
  name: string;
  location: string;
  isOnline: boolean;
  resolution: string;
  lastSeen: string;
  ip: string;
};

type Props = NativeStackScreenProps<RootStackParamList, 'CameraDetail'>;

function formatLastSeen(isoDate: string) {
  try {
    const d = new Date(isoDate);
    return d.toLocaleString('hr-HR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoDate;
  }
}

export function CameraDetailScreen({ route }: Props) {
  const { id } = route.params;
  const navigation = useNavigation<RootStackNavigation>();

  const [camera, setCamera] = useState<Camera | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Fetch kamera
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiFetch(`/api/cameras/${id}`, { includeAuth: true });

        if (res.status === 401) {
          clearAuthSession();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }

        if (res.status === 404) {
          if (!cancelled) setError('Kamera nije pronađena.');
          return;
        }

        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(data.message || 'Neuspješno dohvaćanje kamere.');
          return;
        }

        if (!cancelled) setCamera(data.camera ?? null);
      } catch {
        if (!cancelled) setError('Greška pri dohvaćanju podataka o kameri.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, navigation]);

  // Simulacija live timestampa
  useEffect(() => {
    if (!camera?.isOnline || !isPlaying) return;

    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('hr-HR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [camera?.isOnline, isPlaying]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Cameras');
  }, [navigation]);

  if (loading) {
    return (
      <AppScreenLayout title="Kamera">
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loaderText}>Učitavanje kamere...</Text>
        </View>
      </AppScreenLayout>
    );
  }

  if (error || !camera) {
    return (
      <AppScreenLayout title="Kamera">
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || 'Kamera nije dostupna.'}</Text>
          <Pressable onPress={handleBack} style={styles.backFallbackBtn}>
            <Text style={styles.backFallbackText}>Povratak na popis kamera</Text>
          </Pressable>
        </View>
      </AppScreenLayout>
    );
  }

  return (
    <AppScreenLayout title={camera.name}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Back */}
        <Pressable onPress={handleBack} hitSlop={8} style={styles.backBtn}>
          <Svg viewBox="0 0 20 20" width={16} height={16} fill={colors.accent}>
            <Path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 011.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </Svg>
          <Text style={styles.backText}>Natrag na kamere</Text>
        </Pressable>

        {/* Player */}
        <VideoPlayer
          camera={camera}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          currentTime={currentTime}
          onEnterFullscreen={() => setIsFullscreen(true)}
          fullscreen={false}
        />

        {/* Podaci */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Podaci o kameri</Text>
          <View style={styles.divider} />
          <DetailRow label="Naziv" value={camera.name} />
          <DetailRow label="Lokacija" value={camera.location} />
          <DetailRow
            label="Status"
            renderValue={() => (
              <View style={styles.statusWrap}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: camera.isOnline ? colors.success : colors.textMuted },
                  ]}
                />
                <Text
                  style={[
                    styles.detailValue,
                    { color: camera.isOnline ? colors.success : colors.textMuted },
                  ]}
                >
                  {camera.isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            )}
          />
          <DetailRow label="Rezolucija" value={camera.resolution} />
          <DetailRow label="IP adresa" value={camera.ip} mono />
          <DetailRow label="Zadnji signal" value={formatLastSeen(camera.lastSeen)} />
        </View>

        {/* Brze akcije */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Brze akcije</Text>
          <View style={styles.divider} />
          <View style={styles.actionsRow}>
            <ActionBtn label="Snimi snimku" />
            <ActionBtn label="Pokreni snimanje" />
            <ActionBtn label="Postavi alarm" />
          </View>
          <Text style={styles.actionsNote}>Akcije dolaze u sljedećem milestone-u.</Text>
        </View>
      </ScrollView>

      {/* Fullscreen Modal */}
      <Modal
        visible={isFullscreen}
        animationType="fade"
        onRequestClose={() => setIsFullscreen(false)}
        supportedOrientations={['portrait', 'landscape']}
        statusBarTranslucent
      >
        <StatusBar hidden />
        <SafeAreaView style={styles.fullscreenRoot} edges={['top', 'bottom', 'left', 'right']}>
          <VideoPlayer
            camera={camera}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying((p) => !p)}
            currentTime={currentTime}
            onExitFullscreen={() => setIsFullscreen(false)}
            fullscreen
          />
        </SafeAreaView>
      </Modal>
    </AppScreenLayout>
  );
}

/* ======== Sub-komponente ======== */

type VideoPlayerProps = {
  camera: Camera;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: string;
  fullscreen: boolean;
  onEnterFullscreen?: () => void;
  onExitFullscreen?: () => void;
};

function VideoPlayer({
  camera,
  isPlaying,
  onTogglePlay,
  currentTime,
  fullscreen,
  onEnterFullscreen,
  onExitFullscreen,
}: VideoPlayerProps) {
  return (
    <View style={[styles.player, fullscreen && styles.playerFullscreen]}>
      {/* Feed ili offline */}
      {camera.isOnline ? (
        <View style={styles.feed}>
          <Svg
            viewBox="0 0 24 24"
            width={fullscreen ? 120 : 80}
            height={fullscreen ? 120 : 80}
            fill="none"
            stroke={colors.accent}
            strokeWidth={0.5}
            opacity={0.18}
          >
            <Path
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      ) : (
        <View style={styles.offlineWrap}>
          <Svg
            viewBox="0 0 24 24"
            width={56}
            height={56}
            fill="none"
            stroke={colors.textMuted}
            strokeWidth={1.5}
          >
            <Path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </Svg>
          <Text style={styles.offlineTitle}>Kamera je offline</Text>
          <Text style={styles.offlineSub}>Zadnji signal: {formatLastSeen(camera.lastSeen)}</Text>
        </View>
      )}

      {/* Top bar */}
      {camera.isOnline && (
        <View style={styles.topBar}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <View style={styles.resBadge}>
            <Text style={styles.resText}>{camera.resolution}</Text>
          </View>
        </View>
      )}

      {/* Timestamp */}
      {camera.isOnline && (
        <View style={styles.timestamp}>
          <Text style={styles.tsName} numberOfLines={1}>
            {camera.name}
          </Text>
          <Text style={styles.tsTime}>{currentTime}</Text>
        </View>
      )}

      {/* Paused overlay */}
      {camera.isOnline && !isPlaying && (
        <View style={styles.pausedOverlay}>
          <Svg viewBox="0 0 24 24" width={56} height={56} fill={colors.textPrimary}>
            <Path
              fillRule="evenodd"
              d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
              clipRule="evenodd"
            />
          </Svg>
          <Text style={styles.pausedText}>Stream pauziran</Text>
        </View>
      )}

      {/* Kontrole */}
      {camera.isOnline && (
        <View style={styles.controls}>
          <View style={styles.controlsLeft}>
            <Pressable
              onPress={onTogglePlay}
              hitSlop={8}
              style={({ pressed }) => [styles.ctrlBtn, pressed && styles.ctrlBtnPressed]}
            >
              {isPlaying ? (
                <Svg viewBox="0 0 24 24" width={22} height={22} fill={colors.textPrimary}>
                  <Path
                    fillRule="evenodd"
                    d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
                    clipRule="evenodd"
                  />
                </Svg>
              ) : (
                <Svg viewBox="0 0 24 24" width={22} height={22} fill={colors.textPrimary}>
                  <Path
                    fillRule="evenodd"
                    d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                    clipRule="evenodd"
                  />
                </Svg>
              )}
            </Pressable>
            <Text style={styles.statusText}>{isPlaying ? 'Uživo' : 'Pauzirano'}</Text>
          </View>

          <View style={styles.controlsRight}>
            <Pressable
              onPress={fullscreen ? onExitFullscreen : onEnterFullscreen}
              hitSlop={8}
              style={({ pressed }) => [styles.ctrlBtn, pressed && styles.ctrlBtnPressed]}
            >
              {fullscreen ? (
                <Svg viewBox="0 0 24 24" width={22} height={22} fill={colors.textPrimary}>
                  <Path
                    fillRule="evenodd"
                    d="M3.22 3.22a.75.75 0 011.06 0l3.97 3.97V4.5a.75.75 0 011.5 0V9a.75.75 0 01-.75.75H4.5a.75.75 0 010-1.5h2.69L3.22 4.28a.75.75 0 010-1.06zm17.56 0a.75.75 0 010 1.06l-3.97 3.97h2.69a.75.75 0 010 1.5H15a.75.75 0 01-.75-.75V4.5a.75.75 0 011.5 0v2.69l3.97-3.97a.75.75 0 011.06 0zM3.75 15a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-2.69l-3.97 3.97a.75.75 0 01-1.06-1.06l3.97-3.97H4.5a.75.75 0 01-.75-.75zm10.5 0a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-2.69l3.97 3.97a.75.75 0 11-1.06 1.06l-3.97-3.97v2.69a.75.75 0 01-1.5 0V15z"
                    clipRule="evenodd"
                  />
                </Svg>
              ) : (
                <Svg viewBox="0 0 24 24" width={22} height={22} fill={colors.textPrimary}>
                  <Path
                    fillRule="evenodd"
                    d="M15 3.75a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0V5.56l-3.97 3.97a.75.75 0 11-1.06-1.06l3.97-3.97h-2.69a.75.75 0 01-.75-.75zm-12 0A.75.75 0 013.75 3h4.5a.75.75 0 010 1.5H5.56l3.97 3.97a.75.75 0 01-1.06 1.06L4.5 5.56v2.69a.75.75 0 01-1.5 0v-4.5zm11.47 11.78a.75.75 0 111.06-1.06l3.97 3.97v-2.69a.75.75 0 011.5 0v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 010-1.5h2.69l-3.97-3.97zm-7.94-1.06a.75.75 0 010 1.06L2.56 19.5h2.69a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75v-4.5a.75.75 0 011.5 0v2.69l3.97-3.97a.75.75 0 011.06 0z"
                    clipRule="evenodd"
                  />
                </Svg>
              )}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function DetailRow({
  label,
  value,
  mono,
  renderValue,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  renderValue?: () => React.ReactNode;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      {renderValue ? (
        renderValue()
      ) : (
        <Text style={[styles.detailValue, mono && styles.mono]} numberOfLines={1}>
          {value}
        </Text>
      )}
    </View>
  );
}

function ActionBtn({ label }: { label: string }) {
  return (
    <View style={styles.actionBtn}>
      <Text style={styles.actionBtnText}>{label}</Text>
    </View>
  );
}

/* ======== Styles ======== */

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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backText: {
    ...typography.link,
    color: colors.accent,
  },

  // Player
  player: {
    aspectRatio: 16 / 9,
    backgroundColor: '#05070d',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
    position: 'relative',
  },
  playerFullscreen: {
    flex: 1,
    aspectRatio: undefined,
    borderRadius: 0,
    borderWidth: 0,
    width: '100%',
    height: '100%',
  },
  feed: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a1220',
  },
  offlineWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 24,
  },
  offlineTitle: {
    ...typography.formHeader,
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 6,
  },
  offlineSub: {
    ...typography.label,
    color: colors.textMuted,
    textAlign: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liveBadge: {
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
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  resBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  resText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  timestamp: {
    position: 'absolute',
    bottom: 60,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tsName: {
    color: colors.textPrimary,
    fontSize: 12,
    opacity: 0.85,
    flex: 1,
    marginRight: 8,
  },
  tsTime: {
    color: colors.textPrimary,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    opacity: 0.85,
  },
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pausedText: {
    color: colors.textPrimary,
    ...typography.formSubheader,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  controlsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  controlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ctrlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  ctrlBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  statusText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
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
  mono: {
    fontFamily: 'monospace',
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    flexGrow: 1,
    flexBasis: '47%',
    paddingVertical: 12,
    borderRadius: radius.input,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    opacity: 0.6,
  },
  actionBtnText: {
    ...typography.label,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  actionsNote: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: 10,
    fontStyle: 'italic',
  },

  fullscreenRoot: {
    flex: 1,
    backgroundColor: '#000',
  },
});

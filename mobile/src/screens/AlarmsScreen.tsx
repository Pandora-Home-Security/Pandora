import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppScreenLayout } from '../components/AppScreenLayout';
import { apiFetch } from '../lib/api';
import { colors, radius } from '../theme/colors';
import { typography } from '../theme/typography';
import {
  useNotifications,
  type Alarm,
  type AlarmType,
} from '../contexts/NotificationsContext';

/* ===== Tipovi ===== */
type FilterType = 'all' | AlarmType;
type FilterStatus = 'all' | 'unread' | 'read';

/* ===== Konstante ===== */
const typeLabels: Record<AlarmType, string> = {
  motion: 'Pokret',
  sound: 'Zvuk',
  offline: 'Offline',
  door: 'Vrata',
  temp: 'Temperatura',
};

const typeColors: Record<AlarmType, string> = {
  motion: '#facc15',
  sound: '#60a5fa',
  offline: '#9ca3af',
  door: '#fb923c',
  temp: '#f87171',
};

const typeFilters: FilterType[] = ['all', 'motion', 'sound', 'offline', 'door', 'temp'];
const statusFilters: FilterStatus[] = ['all', 'unread', 'read'];

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('hr-HR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function typeFilterLabel(t: FilterType) {
  if (t === 'all') return 'Svi';
  return typeLabels[t];
}

function statusFilterLabel(s: FilterStatus) {
  if (s === 'all') return 'Svi';
  if (s === 'unread') return 'Nepročitani';
  return 'Pročitani';
}

/* ===== Komponenta ===== */
export function AlarmsScreen() {
  const {
    alarms,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications();

  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [isSimulating, setIsSimulating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      await apiFetch('/api/alarms/simulate', {
        method: 'POST',
        includeAuth: true,
        body: JSON.stringify({}),
      });
      await refresh();
    } catch {
      // tiho ignoriraj
    } finally {
      setIsSimulating(false);
    }
  };

  const filtered = alarms.filter((a) => {
    if (filterType !== 'all' && a.type !== filterType) return false;
    if (filterStatus === 'unread' && a.isRead) return false;
    if (filterStatus === 'read' && !a.isRead) return false;
    return true;
  });

  return (
    <AppScreenLayout title="Alarmi">
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
          <Text style={styles.title}>Alarmi i notifikacije</Text>
          <Text style={styles.subtitle}>Pregled svih alarma u sustavu</Text>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Ukupno</Text>
            <Text style={styles.statValue}>{alarms.length}</Text>
          </View>
          <View
            style={[
              styles.statPill,
              unreadCount > 0 ? styles.statPillUnread : null,
            ]}
          >
            <Text
              style={[
                styles.statLabel,
                unreadCount > 0 ? styles.statLabelUnread : null,
              ]}
            >
              Nepročitano
            </Text>
            <Text
              style={[
                styles.statValue,
                unreadCount > 0 ? styles.statValueUnread : null,
              ]}
            >
              {unreadCount}
            </Text>
          </View>
        </View>

        {/* Akcije */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={handleSimulate}
            disabled={isSimulating}
            style={({ pressed }) => [
              styles.simulateBtn,
              pressed && !isSimulating && styles.simulateBtnPressed,
              isSimulating && styles.simulateBtnDisabled,
            ]}
          >
            <Svg viewBox="0 0 20 20" width={16} height={16} fill={colors.bgDeep}>
              <Path
                fillRule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                clipRule="evenodd"
              />
            </Svg>
            <Text style={styles.simulateText}>
              {isSimulating ? 'Simuliram...' : 'Simuliraj alarm'}
            </Text>
          </Pressable>

          {unreadCount > 0 && (
            <Pressable
              onPress={() => void markAllAsRead()}
              style={({ pressed }) => [
                styles.markAllBtn,
                pressed && styles.markAllBtnPressed,
              ]}
            >
              <Text style={styles.markAllText}>Označi sve pročitano</Text>
            </Pressable>
          )}
        </View>

        {/* Filteri — tip */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>Tip:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {typeFilters.map((t) => (
              <FilterChip
                key={t}
                label={typeFilterLabel(t)}
                active={filterType === t}
                onPress={() => setFilterType(t)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Filteri — status */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>Status:</Text>
          <View style={styles.filterRow}>
            {statusFilters.map((s) => (
              <FilterChip
                key={s}
                label={statusFilterLabel(s)}
                active={filterStatus === s}
                onPress={() => setFilterStatus(s)}
              />
            ))}
          </View>
        </View>

        {isLoading && alarms.length === 0 && (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.loaderText}>Učitavanje alarma...</Text>
          </View>
        )}

        {!isLoading && filtered.length === 0 && (
          <View style={styles.empty}>
            <Svg
              viewBox="0 0 24 24"
              width={48}
              height={48}
              fill="none"
              stroke={colors.textMuted}
              strokeWidth={1.5}
            >
              <Path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
              />
            </Svg>
            <Text style={styles.emptyText}>Nema alarma za prikaz s trenutnim filterima.</Text>
          </View>
        )}

        {filtered.length > 0 && (
          <View style={styles.list}>
            {filtered.map((alarm) => (
              <AlarmCard
                key={alarm.id}
                alarm={alarm}
                onMarkAsRead={() => void markAsRead(alarm.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </AppScreenLayout>
  );
}

/* ===== Podkomponente ===== */

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
        styles.chip,
        active && styles.chipActive,
        pressed && !active && styles.chipPressed,
      ]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function AlarmCard({
  alarm,
  onMarkAsRead,
}: {
  alarm: Alarm;
  onMarkAsRead: () => void;
}) {
  const tone = typeColors[alarm.type];

  return (
    <View style={[styles.card, !alarm.isRead && styles.cardUnread]}>
      <View style={[styles.cardAccent, { backgroundColor: tone }]} />

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={[styles.typeBadge, { borderColor: tone }]}>
            <Text style={[styles.typeBadgeText, { color: tone }]}>
              {typeLabels[alarm.type]}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              alarm.isRead ? styles.statusBadgeRead : styles.statusBadgeUnread,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                alarm.isRead ? styles.statusBadgeTextRead : styles.statusBadgeTextUnread,
              ]}
            >
              {alarm.isRead ? 'Pročitano' : 'Novo'}
            </Text>
          </View>
        </View>

        <Text style={styles.cardMessage} numberOfLines={3}>
          {alarm.message}
        </Text>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Svg viewBox="0 0 20 20" width={12} height={12} fill={colors.textMuted}>
              <Path d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </Svg>
            <Text style={styles.metaText} numberOfLines={1}>
              {alarm.camera}
            </Text>
          </View>
          <Text style={styles.metaTime}>{formatTime(alarm.time)}</Text>
        </View>

        {!alarm.isRead && (
          <Pressable
            onPress={onMarkAsRead}
            style={({ pressed }) => [
              styles.readBtn,
              pressed && styles.readBtnPressed,
            ]}
          >
            <Text style={styles.readBtnText}>Označi pročitanim</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/* ===== Styles ===== */

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
  statPillUnread: {
    borderColor: colors.errorBorder,
    backgroundColor: colors.errorBg,
  },
  statLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  statLabelUnread: { color: colors.errorText },
  statValue: {
    ...typography.formHeader,
    color: colors.textPrimary,
    fontSize: 18,
    marginTop: 2,
  },
  statValueUnread: { color: colors.errorText },

  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.button,
    backgroundColor: colors.accent,
    flexGrow: 1,
    justifyContent: 'center',
  },
  simulateBtnPressed: { opacity: 0.85 },
  simulateBtnDisabled: { opacity: 0.5 },
  simulateText: {
    ...typography.button,
    color: colors.bgDeep,
  },
  markAllBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgSurface,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllBtnPressed: { backgroundColor: colors.bgInput },
  markAllText: {
    ...typography.button,
    color: colors.textPrimary,
    fontSize: 13,
  },

  filterGroup: {
    gap: 6,
  },
  filterGroupLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgSurface,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipPressed: { backgroundColor: colors.bgInput },
  chipText: {
    ...typography.label,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.bgDeep,
    fontWeight: '700',
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
    gap: 8,
  },
  emptyText: {
    ...typography.formSubheader,
    color: colors.textMuted,
    textAlign: 'center',
  },

  list: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  cardUnread: {
    borderColor: colors.accent,
    backgroundColor: colors.bgCard,
  },
  cardAccent: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 12,
    gap: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: colors.bgInput,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeUnread: {
    borderColor: colors.errorBorder,
    backgroundColor: colors.errorBg,
  },
  statusBadgeRead: {
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgInput,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusBadgeTextUnread: { color: colors.errorText },
  statusBadgeTextRead: { color: colors.textMuted },

  cardMessage: {
    ...typography.formSubheader,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  metaText: {
    ...typography.label,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  metaTime: {
    ...typography.label,
    color: colors.textMuted,
  },
  readBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.input,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
    marginTop: 4,
  },
  readBtnPressed: { opacity: 0.7 },
  readBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
});

import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { AppScreenLayout } from '../components/AppScreenLayout';
import { colors, radius } from '../theme/colors';
import { typography } from '../theme/typography';
import {
  mockSensors,
  sensorTypeLabels,
  sensorTypeColors,
  type SensorType,
  type SensorStatus,
} from '../data/mockData';

type FilterType = 'all' | SensorType;
type FilterStatus = 'all' | SensorStatus;

function SensorIcon({ type, size = 20 }: { type: SensorType; size?: number }) {
  const color = sensorTypeColors[type];
  const props = {
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
        <Svg {...props}>
          <Path d="M4 20h16" />
          <Path d="M6 20V4h12v16" />
          <Circle cx={15} cy={12} r={0.8} fill={color} stroke="none" />
        </Svg>
      );
    case 'window':
      return (
        <Svg {...props}>
          <Rect x={4} y={4} width={16} height={16} rx={1.5} />
          <Path d="M4 12h16M12 4v16" />
        </Svg>
      );
    case 'smoke':
      return (
        <Svg {...props}>
          <Path d="M5 18c0-1.5 1-2 2-2s2 .5 2 2" />
          <Path d="M9 14c0-1.5 1.2-2.3 2.5-2.3s2.5.8 2.5 2.3" />
          <Path d="M13 10c0-1.8 1.3-2.8 3-2.8s3 1 3 2.8" />
          <Path d="M3 21h18" />
        </Svg>
      );
    case 'temperature':
      return (
        <Svg {...props}>
          <Path d="M14 14.76V5a2 2 0 1 0-4 0v9.76a4 4 0 1 0 4 0z" />
          <Line x1={12} y1={9} x2={12} y2={15} />
        </Svg>
      );
    case 'motion':
      return (
        <Svg {...props}>
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

export function SensorsScreen() {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const filtered = useMemo(
    () =>
      mockSensors.filter((s) => {
        if (filterType !== 'all' && s.type !== filterType) return false;
        if (filterStatus !== 'all' && s.status !== filterStatus) return false;
        return true;
      }),
    [filterType, filterStatus],
  );

  const activeCount = mockSensors.filter((s) => s.status === 'active').length;
  const inactiveCount = mockSensors.length - activeCount;

  return (
    <AppScreenLayout title="Senzori">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        {/* Intro */}
        <View style={styles.intro}>
          <Text style={styles.title}>IoT Senzori</Text>
          <Text style={styles.subtitle}>Pregled svih senzora u sustavu</Text>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Ukupno</Text>
            <Text style={styles.statValue}>{mockSensors.length}</Text>
          </View>
          <View style={[styles.statPill, styles.statPillActive]}>
            <View style={[styles.statDot, styles.statDotActive]} />
            <Text style={[styles.statLabel, styles.statLabelActive]}>Aktivni</Text>
            <Text style={[styles.statValue, styles.statValueActive]}>{activeCount}</Text>
          </View>
          <View style={[styles.statPill, styles.statPillInactive]}>
            <View style={[styles.statDot, styles.statDotInactive]} />
            <Text style={[styles.statLabel, styles.statLabelInactive]}>Neaktivni</Text>
            <Text style={[styles.statValue, styles.statValueInactive]}>{inactiveCount}</Text>
          </View>
        </View>

        {/* Filteri */}
        <View style={styles.filtersCard}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>Tip</Text>
            <View style={styles.filterRow}>
              {typeFilterOptions.map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => setFilterType(opt.key)}
                  style={[
                    styles.filterBtn,
                    filterType === opt.key && styles.filterBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterBtnText,
                      filterType === opt.key && styles.filterBtnTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.filterDivider} />
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>Status</Text>
            <View style={styles.filterRow}>
              {statusFilterOptions.map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => setFilterStatus(opt.key)}
                  style={[
                    styles.filterBtn,
                    filterStatus === opt.key && styles.filterBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterBtnText,
                      filterStatus === opt.key && styles.filterBtnTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Empty */}
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Nema senzora za prikaz s trenutnim filterima.
            </Text>
          </View>
        )}

        {/* Kartice */}
        {filtered.length > 0 && (
          <View style={styles.grid}>
            {filtered.map((sensor) => {
              const typeColor = sensorTypeColors[sensor.type];
              const isActive = sensor.status === 'active';

              return (
                <View
                  key={sensor.id}
                  style={[styles.card, !isActive && styles.cardInactive]}
                >
                  {/* Card header */}
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.iconWrap,
                        { backgroundColor: typeColor + '1A' },
                      ]}
                    >
                      <SensorIcon type={sensor.type} />
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        isActive ? styles.statusPillActive : styles.statusPillInactive,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: isActive ? colors.success : colors.textMuted,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: isActive ? colors.success : colors.textMuted },
                        ]}
                      >
                        {isActive ? 'Aktivan' : 'Neaktivan'}
                      </Text>
                    </View>
                  </View>

                  {/* Card body */}
                  <View style={styles.cardBody}>
                    <Text style={styles.cardName}>{sensor.name}</Text>
                    <View style={styles.cardMeta}>
                      <View
                        style={[
                          styles.typeBadge,
                          { backgroundColor: typeColor + '1F' },
                        ]}
                      >
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
                  </View>

                  {/* Card footer */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.readingLabel}>Zadnje ocitanje</Text>
                    <Text style={styles.readingValue}>
                      {sensor.lastReading ?? '—'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </AppScreenLayout>
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
    gap: 4,
  },
  statPillActive: {
    borderColor: colors.successBorder,
    backgroundColor: colors.successBg,
  },
  statPillInactive: {
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgSurface,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statDotActive: {
    backgroundColor: colors.success,
  },
  statDotInactive: {
    backgroundColor: colors.textMuted,
  },
  statLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  statLabelActive: { color: colors.successText },
  statLabelInactive: { color: colors.textMuted },
  statValue: {
    ...typography.formHeader,
    color: colors.textPrimary,
    fontSize: 18,
  },
  statValueActive: { color: colors.successText },
  statValueInactive: { color: colors.textMuted },

  // Filteri
  filtersCard: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.card,
    padding: 14,
    gap: 10,
  },
  filterGroup: {
    gap: 8,
  },
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
  filterBtnText: {
    ...typography.formSubheader,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterBtnTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },

  // Empty
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.formSubheader,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // Grid
  grid: {
    gap: 12,
  },

  // Card
  card: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.card,
    padding: 14,
    gap: 12,
  },
  cardInactive: {
    opacity: 0.7,
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
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusPillActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  statusPillInactive: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderColor: 'rgba(107, 114, 128, 0.2)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Card body
  cardBody: {
    gap: 8,
  },
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
  },
  locationText: {
    ...typography.formSubheader,
    color: colors.textMuted,
    fontSize: 12,
  },

  // Card footer
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
  },
});

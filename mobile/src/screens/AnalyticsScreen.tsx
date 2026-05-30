import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { AppScreenLayout } from '../components/AppScreenLayout';
import { LoadingState, EmptyState } from '../components/DataStates';
import {
  useNotifications,
  type Alarm,
  type AlarmType,
} from '../contexts/NotificationsContext';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';
import { radius, type ColorPalette } from '../theme/colors';
import { typography } from '../theme/typography';

/* ===== Tipovi i konstante ===== */
type Granularnost = 'dan' | 'tjedan' | 'mjesec';

const nazivTipa: Record<AlarmType, string> = {
  motion: 'Pokret',
  sound: 'Zvuk',
  offline: 'Offline',
  door: 'Vrata',
  temp: 'Temperatura',
};

const bojaTipa: Record<AlarmType, string> = {
  motion: '#60a5fa',
  sound: '#a78bfa',
  offline: '#9ca3af',
  door: '#34d399',
  temp: '#fb923c',
};

const ACCENT = '#d4a853';
const ACCENT_DIM = 'rgba(212, 168, 83, 0.4)';

const mjeseci = ['Sij', 'Velj', 'Ožu', 'Tra', 'Svi', 'Lip', 'Srp', 'Kol', 'Ruj', 'Lis', 'Stu', 'Pro'];

const labelGranularnosti: Record<Granularnost, string> = {
  dan: 'Dan',
  tjedan: 'Tjedan',
  mjesec: 'Mjesec',
};

/* ===== Pomoćne funkcije ===== */
function pocetakRazdoblja(datum: Date, g: Granularnost): Date {
  const d = new Date(datum.getFullYear(), datum.getMonth(), datum.getDate());
  if (g === 'tjedan') {
    const pomak = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - pomak);
  } else if (g === 'mjesec') {
    d.setDate(1);
  }
  return d;
}

function sljedeceRazdoblje(datum: Date, g: Granularnost): Date {
  const d = new Date(datum);
  if (g === 'dan') d.setDate(d.getDate() + 1);
  else if (g === 'tjedan') d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

function oznakaRazdoblja(datum: Date, g: Granularnost): string {
  if (g === 'mjesec') return `${mjeseci[datum.getMonth()]} ${String(datum.getFullYear()).slice(2)}`;
  const dan = String(datum.getDate()).padStart(2, '0');
  const mj = String(datum.getMonth() + 1).padStart(2, '0');
  return `${dan}.${mj}.`;
}

/* ===== Agregacije ===== */
function podaciKrozVrijeme(alarmi: Alarm[], g: Granularnost): { oznaka: string; broj: number }[] {
  if (alarmi.length === 0) return [];

  const brojPoKljucu = new Map<number, number>();
  for (const a of alarmi) {
    const kljuc = pocetakRazdoblja(new Date(a.time), g).getTime();
    brojPoKljucu.set(kljuc, (brojPoKljucu.get(kljuc) ?? 0) + 1);
  }

  const kljucevi = [...brojPoKljucu.keys()].sort((a, b) => a - b);
  const prvi = new Date(kljucevi[0]);
  const zadnji = new Date(kljucevi[kljucevi.length - 1]);

  const sve: { oznaka: string; broj: number }[] = [];
  for (let d = prvi; d <= zadnji; d = sljedeceRazdoblje(d, g)) {
    sve.push({ oznaka: oznakaRazdoblja(d, g), broj: brojPoKljucu.get(d.getTime()) ?? 0 });
  }

  // Manji limit za mobitel — manje gušvo
  const limit = g === 'dan' ? 14 : g === 'tjedan' ? 10 : 8;
  return sve.slice(-limit);
}

function podaciPoTipu(alarmi: Alarm[]): { tip: AlarmType; naziv: string; broj: number }[] {
  const broj = new Map<AlarmType, number>();
  for (const a of alarmi) broj.set(a.type, (broj.get(a.type) ?? 0) + 1);
  return [...broj.entries()]
    .map(([tip, n]) => ({ tip, naziv: nazivTipa[tip], broj: n }))
    .sort((a, b) => b.broj - a.broj);
}

function podaciPoKameri(alarmi: Alarm[]): { kamera: string; broj: number }[] {
  const broj = new Map<string, number>();
  for (const a of alarmi) broj.set(a.camera, (broj.get(a.camera) ?? 0) + 1);
  return [...broj.entries()]
    .map(([kamera, n]) => ({ kamera, broj: n }))
    .sort((a, b) => b.broj - a.broj);
}

/* ===== Komponente grafova ===== */

function VerticalBarChart({
  data,
  selectedIdx,
  onSelect,
}: {
  data: { oznaka: string; broj: number }[];
  selectedIdx: number | null;
  onSelect: (i: number | null) => void;
}) {
  const { colors } = useTheme();
  const chartStyles = useThemedStyles(makeChartStyles);
  const max = Math.max(...data.map((d) => d.broj), 1);
  const CHART_HEIGHT = 180;

  return (
    <View style={chartStyles.barWrap}>
      {/* Y-os referentne linije */}
      <View style={chartStyles.gridLines} pointerEvents="none">
        <View style={[chartStyles.gridLine, { top: 0 }]} />
        <View style={[chartStyles.gridLine, { top: CHART_HEIGHT / 2 }]} />
        <View style={[chartStyles.gridLine, { top: CHART_HEIGHT }]} />
      </View>

      <View style={[chartStyles.barChartBody, { height: CHART_HEIGHT }]}>
        {data.map((d, i) => {
          const h = Math.max(2, (d.broj / max) * CHART_HEIGHT);
          const isSelected = selectedIdx === i;
          return (
            <Pressable
              key={`${d.oznaka}-${i}`}
              onPress={() => onSelect(isSelected ? null : i)}
              style={chartStyles.barCol}
              hitSlop={4}
            >
              <View
                style={[
                  chartStyles.bar,
                  {
                    height: h,
                    backgroundColor: isSelected ? colors.textPrimary : ACCENT,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      {/* X-os labele — samo svaki N-ti da se ne pretrpa */}
      <View style={chartStyles.barLabels}>
        {data.map((d, i) => {
          const step = data.length > 8 ? 2 : 1;
          const show = i % step === 0;
          return (
            <Text key={`${d.oznaka}-${i}-lbl`} style={chartStyles.barLabel} numberOfLines={1}>
              {show ? d.oznaka : ''}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

function DonutChart({
  data,
  total,
  size = 160,
}: {
  data: { tip: AlarmType; naziv: string; broj: number }[];
  total: number;
  size?: number;
}) {
  const { colors } = useTheme();
  const chartStyles = useThemedStyles(makeChartStyles);
  const strokeW = 24;
  const r = (size - strokeW) / 2;
  const cx = size / 2;
  const cy = size / 2;

  let cumulative = 0;

  function arcPath(startAngle: number, endAngle: number): string {
    const start = polar(cx, cy, r, startAngle);
    const end = polar(cx, cy, r, endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  function polar(cx: number, cy: number, r: number, angle: number) {
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G>
          {/* Pozadinski prsten */}
          <Path
            d={`M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx + r - 0.01} ${cy}`}
            stroke={colors.bgInput}
            strokeWidth={strokeW}
            fill="none"
          />
          {data.map((d) => {
            const fraction = d.broj / total;
            // Mali otok da se segmenti razdvoje
            const padding = 0.02;
            const startAngle = cumulative * 2 * Math.PI - Math.PI / 2 + padding / 2;
            const endAngle =
              (cumulative + fraction) * 2 * Math.PI - Math.PI / 2 - padding / 2;
            cumulative += fraction;

            // Ako je samo jedan segment ili dominantan, koristi puni krug
            if (fraction > 0.99) {
              return (
                <Path
                  key={d.tip}
                  d={`M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx + r - 0.01} ${cy}`}
                  stroke={bojaTipa[d.tip]}
                  strokeWidth={strokeW}
                  fill="none"
                  strokeLinecap="butt"
                />
              );
            }

            if (endAngle <= startAngle) return null;

            return (
              <Path
                key={d.tip}
                d={arcPath(startAngle, endAngle)}
                stroke={bojaTipa[d.tip]}
                strokeWidth={strokeW}
                fill="none"
                strokeLinecap="butt"
              />
            );
          })}
        </G>
      </Svg>
      <View style={chartStyles.donutCenter} pointerEvents="none">
        <Text style={chartStyles.donutTotal}>{total}</Text>
        <Text style={chartStyles.donutLabel}>ukupno</Text>
      </View>
    </View>
  );
}

function HorizontalBarChart({
  data,
}: {
  data: { kamera: string; broj: number }[];
}) {
  const chartStyles = useThemedStyles(makeChartStyles);
  const max = Math.max(...data.map((d) => d.broj), 1);
  return (
    <View style={chartStyles.hbarList}>
      {data.map((d, i) => {
        const widthPct = (d.broj / max) * 100;
        const isTop = i === 0;
        return (
          <View key={`${d.kamera}-${i}`} style={chartStyles.hbarRow}>
            <Text style={chartStyles.hbarName} numberOfLines={1}>
              {d.kamera}
            </Text>
            <View style={chartStyles.hbarTrack}>
              <View
                style={[
                  chartStyles.hbarFill,
                  {
                    width: `${widthPct}%`,
                    backgroundColor: isTop ? ACCENT : ACCENT_DIM,
                  },
                ]}
              />
            </View>
            <Text style={[chartStyles.hbarValue, isTop && { color: ACCENT }]}>{d.broj}</Text>
          </View>
        );
      })}
    </View>
  );
}

/* ===== StatKartica ===== */
function StatKartica({
  naziv,
  vrijednost,
  boja,
}: {
  naziv: string;
  vrijednost: string;
  boja?: string;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, boja ? { color: boja } : null]} numberOfLines={1}>
        {vrijednost}
      </Text>
      <Text style={styles.statLabel}>{naziv}</Text>
    </View>
  );
}

/* ===== Glavna komponenta ===== */
export function AnalyticsScreen() {
  const { alarms, isLoading } = useNotifications();
  const styles = useThemedStyles(makeStyles);
  const [granularnost, setGranularnost] = useState<Granularnost>('dan');
  const [selectedBarIdx, setSelectedBarIdx] = useState<number | null>(null);

  const krozVrijeme = useMemo(
    () => podaciKrozVrijeme(alarms, granularnost),
    [alarms, granularnost]
  );
  const poTipu = useMemo(() => podaciPoTipu(alarms), [alarms]);
  const poKameri = useMemo(() => podaciPoKameri(alarms), [alarms]);

  const ukupno = alarms.length;
  const neprocitano = alarms.filter((a) => !a.isRead).length;
  const najcesciTip = poTipu[0]?.naziv ?? '—';
  const najaktivnijaKamera = poKameri[0]?.kamera ?? '—';

  if (isLoading && ukupno === 0) {
    return (
      <AppScreenLayout title="Analitika">
        <LoadingState message="Učitavanje podataka..." />
      </AppScreenLayout>
    );
  }

  return (
    <AppScreenLayout title="Analitika">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Intro */}
        <View style={styles.intro}>
          <Text style={styles.title}>Analitika</Text>
          <Text style={styles.subtitle}>Vizualni prikaz statistike i trendova alarma</Text>
        </View>

        {ukupno === 0 ? (
          <EmptyState message="Još nema alarma za analizu." />
        ) : (
          <>
            {/* Stat kartice */}
            <View style={styles.statsGrid}>
              <StatKartica naziv="Ukupno alarma" vrijednost={String(ukupno)} />
              <StatKartica naziv="Nepročitano" vrijednost={String(neprocitano)} boja="#fb923c" />
              <StatKartica naziv="Najčešći tip" vrijednost={najcesciTip} />
              <StatKartica naziv="Najaktivnija kamera" vrijednost={najaktivnijaKamera} />
            </View>

            {/* Graf 1 — broj alarma kroz vrijeme */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>Broj alarma kroz vrijeme</Text>
              </View>

              <View style={styles.toggleGroup}>
                {(['dan', 'tjedan', 'mjesec'] as const).map((g) => {
                  const active = granularnost === g;
                  return (
                    <Pressable
                      key={g}
                      onPress={() => {
                        setGranularnost(g);
                        setSelectedBarIdx(null);
                      }}
                      style={({ pressed }) => [
                        styles.toggleBtn,
                        active && styles.toggleBtnActive,
                        pressed && !active && styles.toggleBtnPressed,
                      ]}
                    >
                      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
                        {labelGranularnosti[g]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {selectedBarIdx !== null && krozVrijeme[selectedBarIdx] && (
                <View style={styles.selectedInfo}>
                  <Text style={styles.selectedInfoLabel}>
                    {krozVrijeme[selectedBarIdx].oznaka}
                  </Text>
                  <Text style={styles.selectedInfoValue}>
                    {krozVrijeme[selectedBarIdx].broj}{' '}
                    {krozVrijeme[selectedBarIdx].broj === 1 ? 'alarm' : 'alarma'}
                  </Text>
                </View>
              )}

              {krozVrijeme.length > 0 ? (
                <VerticalBarChart
                  data={krozVrijeme}
                  selectedIdx={selectedBarIdx}
                  onSelect={setSelectedBarIdx}
                />
              ) : (
                <Text style={styles.chartEmpty}>Nema podataka za odabrano razdoblje.</Text>
              )}

              <Text style={styles.hint}>Dodirni stupac za detalje</Text>
            </View>

            {/* Graf 2 — raspodjela po tipu */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Raspodjela po tipu</Text>
              <View style={styles.donutWrap}>
                <DonutChart data={poTipu} total={ukupno} />
              </View>
              <View style={styles.legend}>
                {poTipu.map((d) => (
                  <View key={d.tip} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: bojaTipa[d.tip] }]} />
                    <Text style={styles.legendName}>{d.naziv}</Text>
                    <Text style={styles.legendValue}>
                      {d.broj} ({Math.round((d.broj / ukupno) * 100)}%)
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Graf 3 — aktivnost po kameri */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Aktivnost po kameri</Text>
              <HorizontalBarChart data={poKameri} />
            </View>
          </>
        )}
      </ScrollView>
    </AppScreenLayout>
  );
}

/* ===== Stylovi ===== */
const makeStyles = (colors: ColorPalette) =>
  StyleSheet.create({
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

    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    statCard: {
      flexGrow: 1,
      flexBasis: '47%',
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radius.card,
      paddingVertical: 14,
      paddingHorizontal: 12,
      alignItems: 'center',
      gap: 4,
    },
    statValue: {
      ...typography.formHeader,
      color: colors.textPrimary,
      fontSize: 18,
    },
    statLabel: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: 11,
      letterSpacing: 0.4,
      textAlign: 'center',
    },

    card: {
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radius.card,
      padding: 16,
      gap: 12,
    },
    cardHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitle: {
      ...typography.formHeader,
      color: colors.textPrimary,
      fontSize: 15,
    },

    toggleGroup: {
      flexDirection: 'row',
      gap: 6,
      backgroundColor: colors.bgInput,
      borderRadius: radius.input,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: 7,
      borderRadius: 8,
      alignItems: 'center',
    },
    toggleBtnActive: {
      backgroundColor: colors.accent,
    },
    toggleBtnPressed: {
      backgroundColor: colors.bgSurface,
    },
    toggleText: {
      ...typography.label,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    toggleTextActive: {
      color: colors.bgDeep,
      fontWeight: '700',
    },

    selectedInfo: {
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accentGlow,
      borderRadius: radius.input,
      paddingVertical: 8,
      paddingHorizontal: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    selectedInfoLabel: {
      ...typography.label,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    selectedInfoValue: {
      ...typography.formSubheader,
      color: colors.accent,
      fontWeight: '700',
    },

    chartEmpty: {
      ...typography.formSubheader,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: 20,
    },
    hint: {
      ...typography.label,
      color: colors.textMuted,
      textAlign: 'center',
      fontSize: 10,
      fontStyle: 'italic',
    },

    donutWrap: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    legend: {
      gap: 6,
      marginTop: 4,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 4,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendName: {
      ...typography.formSubheader,
      color: colors.textPrimary,
      flex: 1,
    },
    legendValue: {
      ...typography.label,
      color: colors.textMuted,
      fontWeight: '600',
    },
  });

const makeChartStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    barWrap: {
      position: 'relative',
      paddingTop: 4,
      paddingBottom: 4,
    },
    gridLines: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 4,
      height: 180,
    },
    gridLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: colors.borderSubtle,
    },
    barChartBody: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 4,
    },
    barCol: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    bar: {
      width: '85%',
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
    },
    barLabels: {
      flexDirection: 'row',
      marginTop: 6,
      gap: 4,
    },
    barLabel: {
      flex: 1,
      ...typography.label,
      color: colors.textMuted,
      fontSize: 9,
      textAlign: 'center',
    },

    donutCenter: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    donutTotal: {
      ...typography.formHeader,
      color: colors.textPrimary,
      fontSize: 22,
    },
    donutLabel: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: 10,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },

    hbarList: {
      gap: 8,
    },
    hbarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    hbarName: {
      ...typography.label,
      color: colors.textSecondary,
      fontSize: 11,
      width: 100,
    },
    hbarTrack: {
      flex: 1,
      height: 16,
      backgroundColor: colors.bgInput,
      borderRadius: 8,
      overflow: 'hidden',
    },
    hbarFill: {
      height: '100%',
      borderRadius: 8,
    },
    hbarValue: {
      ...typography.label,
      color: colors.textSecondary,
      fontWeight: '700',
      fontSize: 12,
      minWidth: 22,
      textAlign: 'right',
    },
  });

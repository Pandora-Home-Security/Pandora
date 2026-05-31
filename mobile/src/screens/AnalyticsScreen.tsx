import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
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

/* ===== Filter konstante ===== */
const FILTER_SVE = 'sve';

// Preset rasponi za datumski filter (mobile UX > date picker)
type DatumPreset = 'sve' | '1d' | '7d' | '30d' | '90d';
const datumPresetOpcije: { key: DatumPreset; label: string }[] = [
  { key: 'sve', label: 'Sve' },
  { key: '1d', label: 'Danas' },
  { key: '7d', label: '7 dana' },
  { key: '30d', label: '30 dana' },
  { key: '90d', label: '90 dana' },
];
const datumPresetDana: Record<DatumPreset, number | null> = {
  sve: null,
  '1d': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
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
  const { colors } = useTheme();
  const { alarms, isLoading } = useNotifications();
  const styles = useThemedStyles(makeStyles);
  const [granularnost, setGranularnost] = useState<Granularnost>('dan');
  const [selectedBarIdx, setSelectedBarIdx] = useState<number | null>(null);

  // Stanja filtera
  const [datumPreset, setDatumPreset] = useState<DatumPreset>('sve');
  const [filterKamera, setFilterKamera] = useState<string>(FILTER_SVE);
  const [filterTip, setFilterTip] = useState<AlarmType | typeof FILTER_SVE>(FILTER_SVE);
  const [kameraModalOpen, setKameraModalOpen] = useState(false);

  // Popis kamera za dropdown — jedinstvene vrijednosti iz svih alarma, abecedno
  const kamere = useMemo(
    () => [...new Set(alarms.map((a) => a.camera))].sort((a, b) => a.localeCompare(b, 'hr')),
    [alarms]
  );

  // Primijeni filtere na alarme prije svih agregacija
  const filtrirani = useMemo(() => {
    const dana = datumPresetDana[datumPreset];
    const granica =
      dana !== null ? Date.now() - dana * 24 * 60 * 60 * 1000 : null;
    return alarms.filter((a) => {
      const t = new Date(a.time).getTime();
      if (granica !== null && t < granica) return false;
      if (filterKamera !== FILTER_SVE && a.camera !== filterKamera) return false;
      if (filterTip !== FILTER_SVE && a.type !== filterTip) return false;
      return true;
    });
  }, [alarms, datumPreset, filterKamera, filterTip]);

  const filteriAktivni =
    datumPreset !== 'sve' || filterKamera !== FILTER_SVE || filterTip !== FILTER_SVE;

  const ocistiFiltere = () => {
    setDatumPreset('sve');
    setFilterKamera(FILTER_SVE);
    setFilterTip(FILTER_SVE);
    setSelectedBarIdx(null);
  };

  // Agregacije nad filtriranim podacima
  const krozVrijeme = useMemo(
    () => podaciKrozVrijeme(filtrirani, granularnost),
    [filtrirani, granularnost]
  );
  const poTipu = useMemo(() => podaciPoTipu(filtrirani), [filtrirani]);
  const poKameri = useMemo(() => podaciPoKameri(filtrirani), [filtrirani]);

  const ukupnoSve = alarms.length;
  const ukupno = filtrirani.length;
  const neprocitano = filtrirani.filter((a) => !a.isRead).length;
  const najcesciTip = poTipu[0]?.naziv ?? '—';
  const najaktivnijaKamera = poKameri[0]?.kamera ?? '—';

  if (isLoading && ukupnoSve === 0) {
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

        {ukupnoSve === 0 ? (
          <EmptyState message="Još nema alarma za analizu." />
        ) : (
          <>
            {/* Filteri */}
            <View style={styles.filtersCard}>
              {/* Datumski raspon */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Vremenski raspon</Text>
                <View style={styles.chipRow}>
                  {datumPresetOpcije.map((opt) => {
                    const active = datumPreset === opt.key;
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => {
                          setDatumPreset(opt.key);
                          setSelectedBarIdx(null);
                        }}
                        style={({ pressed }) => [
                          styles.chip,
                          active && styles.chipActive,
                          pressed && !active && styles.chipPressed,
                        ]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Tip alarma */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Tip alarma</Text>
                <View style={styles.chipRow}>
                  <Pressable
                    onPress={() => {
                      setFilterTip(FILTER_SVE);
                      setSelectedBarIdx(null);
                    }}
                    style={({ pressed }) => [
                      styles.chip,
                      filterTip === FILTER_SVE && styles.chipActive,
                      pressed && filterTip !== FILTER_SVE && styles.chipPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filterTip === FILTER_SVE && styles.chipTextActive,
                      ]}
                    >
                      Svi
                    </Text>
                  </Pressable>
                  {(Object.keys(nazivTipa) as AlarmType[]).map((t) => {
                    const active = filterTip === t;
                    return (
                      <Pressable
                        key={t}
                        onPress={() => {
                          setFilterTip(t);
                          setSelectedBarIdx(null);
                        }}
                        style={({ pressed }) => [
                          styles.chip,
                          active && styles.chipActive,
                          pressed && !active && styles.chipPressed,
                        ]}
                      >
                        <View style={[styles.chipDot, { backgroundColor: bojaTipa[t] }]} />
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {nazivTipa[t]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Kamera */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Kamera</Text>
                <Pressable
                  onPress={() => setKameraModalOpen(true)}
                  style={({ pressed }) => [
                    styles.selectBtn,
                    filterKamera !== FILTER_SVE && styles.selectBtnActive,
                    pressed && styles.selectBtnPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.selectBtnText,
                      filterKamera !== FILTER_SVE && styles.selectBtnTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {filterKamera === FILTER_SVE ? 'Sve kamere' : filterKamera}
                  </Text>
                  <Svg viewBox="0 0 20 20" width={14} height={14} fill={colors.textMuted}>
                    <Path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </Svg>
                </Pressable>
              </View>

              {/* Akcije / sažetak */}
              <View style={styles.filterActions}>
                {filteriAktivni && (
                  <Pressable
                    onPress={ocistiFiltere}
                    style={({ pressed }) => [
                      styles.clearBtn,
                      pressed && styles.clearBtnPressed,
                    ]}
                  >
                    <Svg viewBox="0 0 20 20" width={14} height={14} fill={colors.accent}>
                      <Path
                        fillRule="evenodd"
                        d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z"
                        clipRule="evenodd"
                      />
                    </Svg>
                    <Text style={styles.clearBtnText}>Očisti filtere</Text>
                  </Pressable>
                )}
                <Text style={styles.filterSummary}>
                  Prikazano <Text style={styles.filterSummaryBold}>{ukupno}</Text>{' '}
                  {ukupno === 1 ? 'alarm' : 'alarma'} od {ukupnoSve}
                </Text>
              </View>
            </View>

            {ukupno === 0 ? (
              <View style={styles.emptyFiltered}>
                <EmptyState message="Nema alarma koji odgovaraju odabranim filterima." />
                <Pressable
                  onPress={ocistiFiltere}
                  style={({ pressed }) => [
                    styles.clearBtnInline,
                    pressed && styles.clearBtnPressed,
                  ]}
                >
                  <Text style={styles.clearBtnText}>Očisti filtere</Text>
                </Pressable>
              </View>
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
          </>
        )}
      </ScrollView>

      {/* Modal s popisom kamera */}
      <Modal
        visible={kameraModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setKameraModalOpen(false)}
        statusBarTranslucent
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setKameraModalOpen(false)}
          />
          <View style={styles.modalCard} pointerEvents="box-none">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Odaberi kameru</Text>
              <Pressable
                onPress={() => setKameraModalOpen(false)}
                hitSlop={8}
                style={styles.modalClose}
              >
                <Svg viewBox="0 0 20 20" width={20} height={20} fill={colors.textSecondary}>
                  <Path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </Svg>
              </Pressable>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              <Pressable
                onPress={() => {
                  setFilterKamera(FILTER_SVE);
                  setKameraModalOpen(false);
                  setSelectedBarIdx(null);
                }}
                style={({ pressed }) => [
                  styles.modalOption,
                  filterKamera === FILTER_SVE && styles.modalOptionActive,
                  pressed && filterKamera !== FILTER_SVE && styles.modalOptionPressed,
                ]}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    filterKamera === FILTER_SVE && styles.modalOptionTextActive,
                  ]}
                >
                  Sve kamere
                </Text>
                {filterKamera === FILTER_SVE && (
                  <Svg viewBox="0 0 20 20" width={16} height={16} fill={colors.accent}>
                    <Path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </Svg>
                )}
              </Pressable>
              {kamere.map((k) => {
                const active = filterKamera === k;
                return (
                  <Pressable
                    key={k}
                    onPress={() => {
                      setFilterKamera(k);
                      setKameraModalOpen(false);
                      setSelectedBarIdx(null);
                    }}
                    style={({ pressed }) => [
                      styles.modalOption,
                      active && styles.modalOptionActive,
                      pressed && !active && styles.modalOptionPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        active && styles.modalOptionTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {k}
                    </Text>
                    {active && (
                      <Svg viewBox="0 0 20 20" width={16} height={16} fill={colors.accent}>
                        <Path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clipRule="evenodd"
                        />
                      </Svg>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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

    // Filteri
    filtersCard: {
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radius.card,
      padding: 14,
      gap: 12,
    },
    filterGroup: {
      gap: 8,
    },
    filterLabel: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: 10,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.bgInput,
    },
    chipActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    chipPressed: {
      backgroundColor: colors.bgSurface,
    },
    chipText: {
      ...typography.label,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    chipTextActive: {
      color: colors.accent,
      fontWeight: '700',
    },
    chipDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    selectBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderRadius: radius.input,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.bgInput,
      gap: 8,
    },
    selectBtnActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    selectBtnPressed: {
      backgroundColor: colors.bgSurface,
    },
    selectBtnText: {
      ...typography.formSubheader,
      color: colors.textSecondary,
      flex: 1,
    },
    selectBtnTextActive: {
      color: colors.accent,
      fontWeight: '600',
    },
    filterActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
      paddingTop: 10,
      flexWrap: 'wrap',
    },
    clearBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.input,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    clearBtnPressed: {
      opacity: 0.7,
    },
    clearBtnInline: {
      alignSelf: 'center',
      marginTop: 8,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    clearBtnText: {
      ...typography.label,
      color: colors.accent,
      fontWeight: '700',
    },
    filterSummary: {
      ...typography.label,
      color: colors.textMuted,
      flexShrink: 1,
      textAlign: 'right',
    },
    filterSummaryBold: {
      color: colors.textPrimary,
      fontWeight: '700',
    },
    emptyFiltered: {
      gap: 4,
    },

    // Modal kamera
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'center',
      paddingHorizontal: 18,
    },
    modalCard: {
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radius.card,
      maxHeight: '70%',
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    modalTitle: {
      ...typography.formHeader,
      color: colors.textPrimary,
      fontSize: 16,
    },
    modalClose: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalList: {
      padding: 8,
    },
    modalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: radius.input,
      gap: 8,
    },
    modalOptionActive: {
      backgroundColor: colors.accentSoft,
    },
    modalOptionPressed: {
      backgroundColor: colors.bgInput,
    },
    modalOptionText: {
      ...typography.formSubheader,
      color: colors.textPrimary,
      flex: 1,
    },
    modalOptionTextActive: {
      color: colors.accent,
      fontWeight: '700',
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

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  PieChart, Pie,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import './AnalyticsPage.css';
import { useNotifications } from '../contexts/NotificationsContext';
import type { Alarm, AlarmType } from '../contexts/NotificationsContext';

/* ===== Tipovi i konstante ===== */
type Granularnost = 'dan' | 'tjedan' | 'mjesec';

// Hrvatski nazivi tipova alarma (isti kao na stranici alarma)
const nazivTipa: Record<AlarmType, string> = {
  motion: 'Pokret',
  sound: 'Zvuk',
  offline: 'Offline',
  door: 'Vrata',
  temp: 'Temperatura',
};

// Boje po tipu — usklađene s bedževima na stranici alarma
const bojaTipa: Record<AlarmType, string> = {
  motion: '#60a5fa',
  sound: '#a78bfa',
  offline: '#9ca3af',
  door: '#34d399',
  temp: '#fb923c',
};

// Boje teme za grafove (preuzete iz :root CSS varijabli)
const ACCENT = '#d4a853';
const ACCENT_DIM = 'rgba(212, 168, 83, 0.4)';
const GRID = 'rgba(255, 255, 255, 0.06)';
const OS_TEKST = '#8a8f9c';

// Kratice mjeseci za oznake na grafu
const mjeseci = ['Sij', 'Velj', 'Ožu', 'Tra', 'Svi', 'Lip', 'Srp', 'Kol', 'Ruj', 'Lis', 'Stu', 'Pro'];

// Oznake za preklopnik granularnosti (koriste se za gumbe i za aria-label)
const labelGranularnosti: Record<Granularnost, string> = {
  dan: 'Po danu',
  tjedan: 'Po tjednu',
  mjesec: 'Po mjesecu',
};

const FILTER_SVE = 'sve';

/* ===== Pomoćne funkcije za grupiranje po vremenu ===== */

// Vrati početak razdoblja kojem datum pripada:
// dan -> ponoć tog dana, tjedan -> ponedjeljak, mjesec -> 1. u mjesecu.
function pocetakRazdoblja(datum: Date, g: Granularnost): Date {
  const d = new Date(datum.getFullYear(), datum.getMonth(), datum.getDate());
  if (g === 'tjedan') {
    const pomak = (d.getDay() + 6) % 7; // 0 = ponedjeljak
    d.setDate(d.getDate() - pomak);
  } else if (g === 'mjesec') {
    d.setDate(1);
  }
  return d;
}

// Pomakni datum na sljedeće razdoblje (koristi se za popunjavanje praznina na osi).
function sljedeceRazdoblje(datum: Date, g: Granularnost): Date {
  const d = new Date(datum);
  if (g === 'dan') d.setDate(d.getDate() + 1);
  else if (g === 'tjedan') d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

// Tekstualna oznaka razdoblja za x-os.
function oznakaRazdoblja(datum: Date, g: Granularnost): string {
  if (g === 'mjesec') return `${mjeseci[datum.getMonth()]} ${datum.getFullYear()}`;
  const dan = String(datum.getDate()).padStart(2, '0');
  const mj = String(datum.getMonth() + 1).padStart(2, '0');
  return `${dan}.${mj}.`;
}

/* ===== Agregacije podataka ===== */

// Broj alarma po razdoblju. Praznine između prvog i zadnjeg alarma popunjavamo
// nulama da vremenska os bude kontinuirana, a prikazujemo samo zadnjih N razdoblja.
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

  const limit = g === 'dan' ? 30 : 12;
  return sve.slice(-limit);
}

// Raspodjela alarma po tipu (za pie chart), sortirano silazno.
function podaciPoTipu(alarmi: Alarm[]): { tip: AlarmType; naziv: string; broj: number }[] {
  const broj = new Map<AlarmType, number>();
  for (const a of alarmi) broj.set(a.type, (broj.get(a.type) ?? 0) + 1);
  return [...broj.entries()]
    .map(([tip, n]) => ({ tip, naziv: nazivTipa[tip], broj: n }))
    .sort((a, b) => b.broj - a.broj);
}

// Broj alarma po kameri, sortirano silazno (najaktivnija prva).
function podaciPoKameri(alarmi: Alarm[]): { kamera: string; broj: number }[] {
  const broj = new Map<string, number>();
  for (const a of alarmi) broj.set(a.camera, (broj.get(a.camera) ?? 0) + 1);
  return [...broj.entries()]
    .map(([kamera, n]) => ({ kamera, broj: n }))
    .sort((a, b) => b.broj - a.broj);
}

// Broj uz odgovarajući oblik riječi (pojednostavljeno: 1 = alarm, ostalo = alarma).
function tekstAlarma(n: number): string {
  return `${n} ${n === 1 ? 'alarm' : 'alarma'}`;
}

/* ===== Prilagođeni tooltip (Recharts default je svijetao, ne prati temu) ===== */
function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const stavka = payload[0];
  const naslov = label ?? stavka.name ?? '';
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-label">{naslov}</span>
      <span className="chart-tooltip-value">{tekstAlarma(Number(stavka.value ?? 0))}</span>
    </div>
  );
}

/* ===== Mala kartica sa statistikom ===== */
function StatKartica({ naziv, vrijednost, boja }: { naziv: string; vrijednost: string; boja?: string }) {
  return (
    <div className="analytics-stat">
      <span className="analytics-stat-value" style={boja ? { color: boja } : undefined}>
        {vrijednost}
      </span>
      <span className="analytics-stat-label">{naziv}</span>
    </div>
  );
}

/* ===== Glavna komponenta ===== */
function AnalyticsPage() {
  // Alarme čitamo iz konteksta (već se dohvaćaju i osvježavaju pollingom)
  const { alarms, isLoading } = useNotifications();
  const [granularnost, setGranularnost] = useState<Granularnost>('dan');

  // Stanja filtera
  const [datumOd, setDatumOd] = useState('');
  const [datumDo, setDatumDo] = useState('');
  const [filterKamera, setFilterKamera] = useState<string>(FILTER_SVE);
  const [filterTip, setFilterTip] = useState<AlarmType | typeof FILTER_SVE>(FILTER_SVE);

  // Popis kamera za dropdown — jedinstvene vrijednosti iz svih alarma, abecedno
  const kamere = useMemo(
    () => [...new Set(alarms.map((a) => a.camera))].sort((a, b) => a.localeCompare(b, 'hr')),
    [alarms],
  );

  // Primijeni filtere na alarme prije svih agregacija
  const filtrirani = useMemo(() => {
    const od = datumOd ? new Date(`${datumOd}T00:00:00`).getTime() : null;
    const doKraja = datumDo ? new Date(`${datumDo}T23:59:59.999`).getTime() : null;
    return alarms.filter((a) => {
      const t = new Date(a.time).getTime();
      if (od !== null && t < od) return false;
      if (doKraja !== null && t > doKraja) return false;
      if (filterKamera !== FILTER_SVE && a.camera !== filterKamera) return false;
      if (filterTip !== FILTER_SVE && a.type !== filterTip) return false;
      return true;
    });
  }, [alarms, datumOd, datumDo, filterKamera, filterTip]);

  const filteriAktivni =
    datumOd !== '' || datumDo !== '' || filterKamera !== FILTER_SVE || filterTip !== FILTER_SVE;

  const ocistiFiltere = () => {
    setDatumOd('');
    setDatumDo('');
    setFilterKamera(FILTER_SVE);
    setFilterTip(FILTER_SVE);
  };

  // Memoiziramo agregacije (na filtriranim podacima) da se ne računaju ponovno na svaki render
  const krozVrijeme = useMemo(() => podaciKrozVrijeme(filtrirani, granularnost), [filtrirani, granularnost]);
  const poTipu = useMemo(() => podaciPoTipu(filtrirani), [filtrirani]);
  const poKameri = useMemo(() => podaciPoKameri(filtrirani), [filtrirani]);

  const ukupnoSve = alarms.length;
  const ukupno = filtrirani.length;
  const neprocitano = filtrirani.filter((a) => !a.isRead).length;
  const najcesciTip = poTipu[0]?.naziv ?? '—';
  const najaktivnijaKamera = poKameri[0]?.kamera ?? '—';

  // Spinner samo pri prvom učitavanju (dok kontekst još nema podataka)
  if (isLoading && ukupnoSve === 0) {
    return (
      <div className="analytics-loading">
        <div className="analytics-spinner" />
        <p>Učitavanje podataka...</p>
      </div>
    );
  }

  return (
    <>
      <div className="analytics-header">
        <h2 className="analytics-title">Analitika</h2>
        <p className="analytics-subtitle">Vizualni prikaz statistike i trendova alarma</p>
      </div>

      {ukupnoSve === 0 ? (
        <div className="analytics-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="analytics-empty-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>Još nema alarma za analizu.</p>
        </div>
      ) : (
        <>
          {/* Filteri — vremenski raspon, kamera i tip alarma */}
          <section className="analytics-filters">
            <div className="analytics-filter-group">
              <label className="analytics-filter-label" htmlFor="filter-od">Datum od</label>
              <input
                id="filter-od"
                type="date"
                className="analytics-filter-input"
                value={datumOd}
                max={datumDo || undefined}
                onChange={(e) => setDatumOd(e.target.value)}
              />
            </div>

            <div className="analytics-filter-group">
              <label className="analytics-filter-label" htmlFor="filter-do">Datum do</label>
              <input
                id="filter-do"
                type="date"
                className="analytics-filter-input"
                value={datumDo}
                min={datumOd || undefined}
                onChange={(e) => setDatumDo(e.target.value)}
              />
            </div>

            <div className="analytics-filter-group">
              <label className="analytics-filter-label" htmlFor="filter-kamera">Kamera</label>
              <select
                id="filter-kamera"
                className="analytics-filter-select"
                value={filterKamera}
                onChange={(e) => setFilterKamera(e.target.value)}
              >
                <option value={FILTER_SVE}>Sve kamere</option>
                {kamere.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div className="analytics-filter-group">
              <label className="analytics-filter-label" htmlFor="filter-tip">Tip alarma</label>
              <select
                id="filter-tip"
                className="analytics-filter-select"
                value={filterTip}
                onChange={(e) => setFilterTip(e.target.value as AlarmType | typeof FILTER_SVE)}
              >
                <option value={FILTER_SVE}>Svi tipovi</option>
                {(Object.keys(nazivTipa) as AlarmType[]).map((t) => (
                  <option key={t} value={t}>{nazivTipa[t]}</option>
                ))}
              </select>
            </div>

            <div className="analytics-filter-actions">
              {filteriAktivni && (
                <button type="button" className="analytics-filter-reset" onClick={ocistiFiltere}>
                  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" />
                  </svg>
                  Očisti filtere
                </button>
              )}
              <span className="analytics-filter-summary">
                Prikazano <strong>{ukupno}</strong> {ukupno === 1 ? 'alarm' : 'alarma'} od {ukupnoSve}
              </span>
            </div>
          </section>

          {ukupno === 0 ? (
            <div className="analytics-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="analytics-empty-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <p>Nema alarma koji odgovaraju odabranim filterima.</p>
              <button type="button" className="analytics-filter-reset" onClick={ocistiFiltere}>
                Očisti filtere
              </button>
            </div>
          ) : (
            <>
              {/* Sažetak u stat karticama */}
              <div className="analytics-stats">
                <StatKartica naziv="Ukupno alarma" vrijednost={String(ukupno)} />
                <StatKartica naziv="Nepročitano" vrijednost={String(neprocitano)} boja="#fb923c" />
                <StatKartica naziv="Najčešći tip" vrijednost={najcesciTip} />
                <StatKartica naziv="Najaktivnija kamera" vrijednost={najaktivnijaKamera} />
              </div>

              {/* Graf 1 — broj alarma kroz vrijeme (s preklopnikom granularnosti) */}
              <section className="analytics-card">
                <div className="analytics-card-head">
                  <h3 className="analytics-card-title">Broj alarma kroz vrijeme</h3>
                  <div className="analytics-toggle" role="group" aria-label="Granularnost prikaza">
                    {(['dan', 'tjedan', 'mjesec'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        className={`analytics-toggle-btn ${granularnost === g ? 'analytics-toggle-btn-active' : ''}`}
                        aria-pressed={granularnost === g}
                        onClick={() => setGranularnost(g)}
                      >
                        {labelGranularnosti[g]}
                      </button>
                    ))}
                  </div>
                </div>
                <div
                  role="img"
                  aria-label={`Stupčasti graf broja alarma kroz vrijeme, prikaz ${labelGranularnosti[granularnost].toLowerCase()}. Ukupno ${ukupno} alarma.`}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={krozVrijeme} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                      <XAxis dataKey="oznaka" stroke={GRID} tick={{ fill: OS_TEKST, fontSize: 12 }} tickLine={false} />
                      <YAxis allowDecimals={false} stroke={GRID} tick={{ fill: OS_TEKST, fontSize: 12 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                      <Bar dataKey="broj" name="Broj alarma" fill={ACCENT} radius={[6, 6, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Donji red — raspodjela po tipu + aktivnost po kameri */}
              <div className="analytics-grid">
                {/* Graf 2 — raspodjela po tipu (pie) */}
                <section className="analytics-card">
                  <h3 className="analytics-card-title">Raspodjela po tipu</h3>
                  <div className="analytics-pie-wrap">
                    <div
                      role="img"
                      aria-label={`Kružni graf raspodjele alarma po tipu. Najčešći tip: ${najcesciTip}.`}
                    >
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={poTipu}
                            dataKey="broj"
                            nameKey="naziv"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={95}
                            paddingAngle={2}
                            stroke="none"
                          >
                            {poTipu.map((d) => (
                              <Cell key={d.tip} fill={bojaTipa[d.tip]} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Vlastita legenda — preglednija i u stilu stranice */}
                    <ul className="analytics-legend">
                      {poTipu.map((d) => (
                        <li key={d.tip} className="analytics-legend-item">
                          <span className="analytics-legend-dot" style={{ background: bojaTipa[d.tip] }} />
                          <span className="analytics-legend-name">{d.naziv}</span>
                          <span className="analytics-legend-value">
                            {d.broj} ({Math.round((d.broj / ukupno) * 100)}%)
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                {/* Graf 3 — aktivnost po kameri (horizontalni bar, najaktivnija istaknuta) */}
                <section className="analytics-card">
                  <h3 className="analytics-card-title">Aktivnost po kameri</h3>
                  <div
                    role="img"
                    aria-label={`Stupčasti graf aktivnosti po kameri. Najaktivnija kamera: ${najaktivnijaKamera}.`}
                  >
                    <ResponsiveContainer width="100%" height={Math.max(240, poKameri.length * 44)}>
                      <BarChart data={poKameri} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                        <XAxis type="number" allowDecimals={false} stroke={GRID} tick={{ fill: OS_TEKST, fontSize: 12 }} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="kamera" width={130} stroke={GRID} tick={{ fill: OS_TEKST, fontSize: 11 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                        <Bar dataKey="broj" name="Broj alarma" radius={[0, 6, 6, 0]} maxBarSize={26}>
                          {poKameri.map((d, i) => (
                            <Cell key={d.kamera} fill={i === 0 ? ACCENT : ACCENT_DIM} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

export default AnalyticsPage;

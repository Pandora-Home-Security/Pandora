/*
 * Čiste funkcije za agregaciju podataka analitike.
 * Izdvojene iz AnalyticsPage kako bi bile jedinično testabilne (vidi analytics.test.ts).
 */
import type { Alarm, AlarmType } from '../contexts/NotificationsContext';

export type Granularnost = 'dan' | 'tjedan' | 'mjesec';

// Hrvatski nazivi tipova alarma (isti kao na stranici alarma)
export const nazivTipa: Record<AlarmType, string> = {
  motion: 'Pokret',
  sound: 'Zvuk',
  offline: 'Offline',
  door: 'Vrata',
  temp: 'Temperatura',
};

// Kratice mjeseci za oznake na grafu
const mjeseci = ['Sij', 'Velj', 'Ožu', 'Tra', 'Svi', 'Lip', 'Srp', 'Kol', 'Ruj', 'Lis', 'Stu', 'Pro'];

/* ===== Pomoćne funkcije za grupiranje po vremenu ===== */

// Vrati početak razdoblja kojem datum pripada:
// dan -> ponoć tog dana, tjedan -> ponedjeljak, mjesec -> 1. u mjesecu.
export function pocetakRazdoblja(datum: Date, g: Granularnost): Date {
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
export function sljedeceRazdoblje(datum: Date, g: Granularnost): Date {
  const d = new Date(datum);
  if (g === 'dan') d.setDate(d.getDate() + 1);
  else if (g === 'tjedan') d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

// Tekstualna oznaka razdoblja za x-os.
export function oznakaRazdoblja(datum: Date, g: Granularnost): string {
  if (g === 'mjesec') return `${mjeseci[datum.getMonth()]} ${datum.getFullYear()}`;
  const dan = String(datum.getDate()).padStart(2, '0');
  const mj = String(datum.getMonth() + 1).padStart(2, '0');
  return `${dan}.${mj}.`;
}

/* ===== Agregacije podataka ===== */

// Broj alarma po razdoblju. Praznine između prvog i zadnjeg alarma popunjavamo
// nulama da vremenska os bude kontinuirana, a prikazujemo samo zadnjih N razdoblja.
export function podaciKrozVrijeme(alarmi: Alarm[], g: Granularnost): { oznaka: string; broj: number }[] {
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
export function podaciPoTipu(alarmi: Alarm[]): { tip: AlarmType; naziv: string; broj: number }[] {
  const broj = new Map<AlarmType, number>();
  for (const a of alarmi) broj.set(a.type, (broj.get(a.type) ?? 0) + 1);
  return [...broj.entries()]
    .map(([tip, n]) => ({ tip, naziv: nazivTipa[tip], broj: n }))
    .sort((a, b) => b.broj - a.broj);
}

// Broj alarma po kameri, sortirano silazno (najaktivnija prva).
export function podaciPoKameri(alarmi: Alarm[]): { kamera: string; broj: number }[] {
  const broj = new Map<string, number>();
  for (const a of alarmi) broj.set(a.camera, (broj.get(a.camera) ?? 0) + 1);
  return [...broj.entries()]
    .map(([kamera, n]) => ({ kamera, broj: n }))
    .sort((a, b) => b.broj - a.broj);
}

// Broj uz odgovarajući oblik riječi (pojednostavljeno: 1 = alarm, ostalo = alarma).
export function tekstAlarma(n: number): string {
  return `${n} ${n === 1 ? 'alarm' : 'alarma'}`;
}

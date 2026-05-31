import { describe, it, expect } from 'vitest';
import type { Alarm, AlarmType } from '../contexts/NotificationsContext';
import {
  tekstAlarma,
  podaciPoTipu,
  podaciPoKameri,
  podaciKrozVrijeme,
  pocetakRazdoblja,
  oznakaRazdoblja,
  nazivTipa,
} from './analytics';

// Pomoćni graditelj alarma (vremena su lokalna, bez 'Z', radi determinističkog grupiranja po danu)
let brojac = 0;
function alarm(type: AlarmType, camera: string, time: string, isRead = false): Alarm {
  brojac += 1;
  return { id: String(brojac), type, camera, message: 'test', time, isRead };
}

describe('tekstAlarma', () => {
  it('koristi jedninu za 1', () => {
    expect(tekstAlarma(1)).toBe('1 alarm');
  });

  it('koristi množinu za 0 i više od 1', () => {
    expect(tekstAlarma(0)).toBe('0 alarma');
    expect(tekstAlarma(5)).toBe('5 alarma');
  });
});

describe('podaciPoTipu', () => {
  it('vraća prazno polje kad nema alarma', () => {
    expect(podaciPoTipu([])).toEqual([]);
  });

  it('broji po tipu i sortira silazno', () => {
    const alarmi = [
      alarm('motion', 'Kam1', '2026-04-01T10:00:00'),
      alarm('motion', 'Kam2', '2026-04-01T11:00:00'),
      alarm('door', 'Kam1', '2026-04-01T12:00:00'),
    ];
    const rezultat = podaciPoTipu(alarmi);
    expect(rezultat[0]).toEqual({ tip: 'motion', naziv: nazivTipa.motion, broj: 2 });
    expect(rezultat[1]).toEqual({ tip: 'door', naziv: nazivTipa.door, broj: 1 });
  });
});

describe('podaciPoKameri', () => {
  it('broji po kameri i sortira silazno (najaktivnija prva)', () => {
    const alarmi = [
      alarm('motion', 'Garaža', '2026-04-01T10:00:00'),
      alarm('sound', 'Garaža', '2026-04-01T11:00:00'),
      alarm('door', 'Ulaz', '2026-04-01T12:00:00'),
    ];
    const rezultat = podaciPoKameri(alarmi);
    expect(rezultat).toEqual([
      { kamera: 'Garaža', broj: 2 },
      { kamera: 'Ulaz', broj: 1 },
    ]);
  });
});

describe('podaciKrozVrijeme', () => {
  it('vraća prazno polje kad nema alarma', () => {
    expect(podaciKrozVrijeme([], 'dan')).toEqual([]);
  });

  it('grupira po danu i popunjava praznine nulama', () => {
    const alarmi = [
      alarm('motion', 'Kam1', '2026-04-01T10:00:00'),
      alarm('motion', 'Kam1', '2026-04-01T14:00:00'),
      alarm('door', 'Kam1', '2026-04-03T09:00:00'),
    ];
    const rezultat = podaciKrozVrijeme(alarmi, 'dan');
    // 01.04. (2), 02.04. (0 - praznina), 03.04. (1)
    expect(rezultat).toEqual([
      { oznaka: '01.04.', broj: 2 },
      { oznaka: '02.04.', broj: 0 },
      { oznaka: '03.04.', broj: 1 },
    ]);
  });
});

describe('pocetakRazdoblja', () => {
  it('za tjedan vraća ponedjeljak tog tjedna', () => {
    // 15.04.2026. je srijeda -> ponedjeljak je 13.04.2026.
    const srijeda = new Date(2026, 3, 15);
    const ponedjeljak = pocetakRazdoblja(srijeda, 'tjedan');
    expect(ponedjeljak.getFullYear()).toBe(2026);
    expect(ponedjeljak.getMonth()).toBe(3);
    expect(ponedjeljak.getDate()).toBe(13);
  });

  it('za mjesec vraća prvi dan u mjesecu', () => {
    const datum = new Date(2026, 3, 15);
    expect(pocetakRazdoblja(datum, 'mjesec').getDate()).toBe(1);
  });
});

describe('oznakaRazdoblja', () => {
  it('za dan vraća format DD.MM.', () => {
    expect(oznakaRazdoblja(new Date(2026, 3, 5), 'dan')).toBe('05.04.');
  });

  it('za mjesec vraća kraticu mjeseca i godinu', () => {
    expect(oznakaRazdoblja(new Date(2026, 3, 5), 'mjesec')).toBe('Tra 2026');
  });
});

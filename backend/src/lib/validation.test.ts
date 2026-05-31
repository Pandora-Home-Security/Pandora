import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidPassword, isNonEmptyString } from './validation';

describe('isValidEmail', () => {
  it('prihvaća ispravne email adrese', () => {
    expect(isValidEmail('ivan@primjer.hr')).toBe(true);
    expect(isValidEmail('a.b-c@sub.domena.com')).toBe(true);
  });

  it('odbija neispravne email adrese', () => {
    expect(isValidEmail('bez-affne')).toBe(false);
    expect(isValidEmail('nema@domenu')).toBe(false);
    expect(isValidEmail('@domena.hr')).toBe(false);
    expect(isValidEmail('ima razmak@domena.hr')).toBe(false);
  });

  it('odbija ne-string vrijednosti', () => {
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(123)).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('prihvaća lozinku od barem 8 znakova', () => {
    expect(isValidPassword('12345678')).toBe(true);
    expect(isValidPassword('jako-duga-lozinka')).toBe(true);
  });

  it('odbija prekratku lozinku', () => {
    expect(isValidPassword('1234567')).toBe(false);
    expect(isValidPassword('')).toBe(false);
  });

  it('odbija ne-string vrijednosti', () => {
    expect(isValidPassword(undefined)).toBe(false);
    expect(isValidPassword(12345678)).toBe(false);
  });
});

describe('isNonEmptyString', () => {
  it('prihvaća string s vidljivim sadržajem', () => {
    expect(isNonEmptyString('Ivan')).toBe(true);
    expect(isNonEmptyString('  ima sadržaj  ')).toBe(true);
  });

  it('odbija prazan string ili samo razmake', () => {
    expect(isNonEmptyString('')).toBe(false);
    expect(isNonEmptyString('    ')).toBe(false);
  });

  it('odbija ne-string vrijednosti', () => {
    expect(isNonEmptyString(undefined)).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString(42)).toBe(false);
  });
});

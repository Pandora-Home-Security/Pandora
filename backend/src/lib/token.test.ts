import { describe, it, expect } from 'vitest';
import { signToken, verifyToken, type AuthTokenPayload } from './token';

const zaSekundi = (n: number) => Math.floor(Date.now() / 1000) + n;

function validniPayload(): AuthTokenPayload {
  return {
    sub: '1',
    email: 'test@primjer.hr',
    ime: 'Test Korisnik',
    role: 'korisnik',
    exp: zaSekundi(3600),
  };
}

describe('signToken / verifyToken', () => {
  it('potpisani token se može uspješno verificirati (round-trip)', () => {
    const payload = validniPayload();
    const token = signToken(payload);
    const dekodirano = verifyToken(token);
    expect(dekodirano).not.toBeNull();
    expect(dekodirano?.sub).toBe('1');
    expect(dekodirano?.email).toBe('test@primjer.hr');
    expect(dekodirano?.role).toBe('korisnik');
  });

  it('token ima tri dijela odvojena točkom (header.payload.signature)', () => {
    const token = signToken(validniPayload());
    expect(token.split('.')).toHaveLength(3);
  });

  it('vraća null za neispravan oblik tokena', () => {
    expect(verifyToken('neispravno')).toBeNull();
    expect(verifyToken('a.b')).toBeNull();
    expect(verifyToken('')).toBeNull();
  });

  it('vraća null kad je potpis krivotvoren', () => {
    const token = signToken(validniPayload());
    const [h, p] = token.split('.');
    const krivotvoren = `${h}.${p}.lazni_potpis`;
    expect(verifyToken(krivotvoren)).toBeNull();
  });

  it('vraća null kad je payload izmijenjen (potpis se ne poklapa)', () => {
    const token = signToken(validniPayload());
    const parts = token.split('.');
    // Zamijeni payload drugim sadržajem ali zadrži stari potpis
    const drugiPayload = Buffer.from(JSON.stringify({ ...validniPayload(), sub: '999' })).toString('base64url');
    const krivotvoren = `${parts[0]}.${drugiPayload}.${parts[2]}`;
    expect(verifyToken(krivotvoren)).toBeNull();
  });

  it('vraća null za istekli token', () => {
    const token = signToken({ ...validniPayload(), exp: zaSekundi(-10) });
    expect(verifyToken(token)).toBeNull();
  });

  it('postavlja zadanu ulogu "korisnik" kad role nedostaje (kompatibilnost sa starim tokenima)', () => {
    // Payload bez role polja
    const bezRole = { sub: '2', email: 'a@b.hr', ime: 'A', exp: zaSekundi(3600) } as AuthTokenPayload;
    const token = signToken(bezRole);
    const dekodirano = verifyToken(token);
    expect(dekodirano?.role).toBe('korisnik');
  });
});

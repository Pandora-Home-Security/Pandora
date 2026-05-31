/*
 * Validatori ulaznih podataka (email, lozinka, ime).
 * Izdvojeno iz index.ts radi jediničnog testiranja i izbjegavanja dupliciranja.
 */

// Jednostavna provjera oblika email adrese (lokalni-dio@domena.tld).
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value: unknown): value is string =>
  typeof value === 'string' && EMAIL_REGEX.test(value);

// Lozinka mora imati barem 8 znakova.
export const MIN_PASSWORD_LENGTH = 8;

export const isValidPassword = (value: unknown): value is string =>
  typeof value === 'string' && value.length >= MIN_PASSWORD_LENGTH;

// String koji nakon obrezivanja praznina nije prazan (npr. ime).
export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

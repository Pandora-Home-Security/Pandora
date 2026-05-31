const TOKEN_STORAGE_KEY = 'token';

export type UserRole = 'admin' | 'korisnik';

export const getAuthToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

export const setAuthToken = (token: string) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearAuthToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

/** Dekodira polje iz JWT payload-a (bez validacije potpisa — samo za UI prikaz). */
function decodeTokenPayload(): Record<string, unknown> | null {
  const token = getAuthToken();
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function getUserRole(): UserRole {
  const payload = decodeTokenPayload();
  const role = payload?.role;
  return role === 'admin' ? 'admin' : 'korisnik';
}

export function getUserId(): string | null {
  const payload = decodeTokenPayload();
  return typeof payload?.sub === 'string' ? payload.sub : null;
}

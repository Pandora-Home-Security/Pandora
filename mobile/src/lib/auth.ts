// In-memory auth store. NEMA persistence — restart app brise stanje (po dogovoru).
// Sljedeci korak ce zamijeniti ovo s expo-secure-store / AsyncStorage.

export type UserRole = 'admin' | 'korisnik';

export type AuthUser = {
  id: string;
  ime: string;
  email: string;
  role: UserRole;
};

let token: string | null = null;
let user: AuthUser | null = null;

export const getAuthToken = () => token;
export const getAuthUser = () => user;

export const getUserRole = (): UserRole => user?.role ?? 'korisnik';

export const setAuthSession = (newToken: string, newUser: AuthUser) => {
  token = newToken;
  // Backward-compat: ako backend ne posalje role (stari token), tretiraj kao 'korisnik'.
  user = { ...newUser, role: newUser.role ?? 'korisnik' };
};

export const clearAuthSession = () => {
  token = null;
  user = null;
};

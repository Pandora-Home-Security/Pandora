// In-memory auth store. NEMA persistence — restart app brise stanje (po dogovoru).
// Sljedeci korak ce zamijeniti ovo s expo-secure-store / AsyncStorage.

export type AuthUser = {
  id: string;
  ime: string;
  email: string;
};

let token: string | null = null;
let user: AuthUser | null = null;

export const getAuthToken = () => token;
export const getAuthUser = () => user;

export const setAuthSession = (newToken: string, newUser: AuthUser) => {
  token = newToken;
  user = newUser;
};

export const clearAuthSession = () => {
  token = null;
  user = null;
};

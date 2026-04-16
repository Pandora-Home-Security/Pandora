import Constants from 'expo-constants';
import { getAuthToken } from './auth';

// Base URL prioritet:
// 1. EXPO_PUBLIC_API_URL iz .env (override za production / drukciji backend host)
// 2. Auto-detekcija dev hosta iz Expo (radi za fizicki uredjaj + iOS simulator)
// 3. Fallback localhost (radi samo za web/desktop testiranje)
const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
const fallbackHost = debuggerHost ? `http://${debuggerHost}:3001` : 'http://localhost:3001';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? fallbackHost;

type ApiFetchOptions = RequestInit & {
  includeAuth?: boolean;
};

export const apiFetch = async (path: string, options: ApiFetchOptions = {}) => {
  const { includeAuth = false, headers, ...restOptions } = options;
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has('Content-Type') && restOptions.body) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers: requestHeaders,
  });
};

export const getApiBaseUrl = () => API_BASE_URL;

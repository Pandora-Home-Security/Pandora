import { getAuthToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

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

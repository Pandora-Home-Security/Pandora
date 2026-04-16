import { getAuthToken } from './auth';

const API_BASE_URL = 'http://10.0.2.2:3001'; // Android emulator → localhost
// Za fizički uređaj zamijeni s IP adresom računala, npr. 'http://192.168.1.x:3001'

type ApiFetchOptions = RequestInit & {
  includeAuth?: boolean;
};

export const apiFetch = async (path: string, options: ApiFetchOptions = {}) => {
  const { includeAuth = false, headers, ...restOptions } = options;
  const requestHeaders: Record<string, string> = {};

  if (headers) {
    Object.assign(requestHeaders, headers);
  }

  if (!requestHeaders['Content-Type'] && restOptions.body) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (includeAuth) {
    const token = await getAuthToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers: requestHeaders,
  });
};

import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'token';

export const getAuthToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const clearAuthToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

export const decodeToken = async (): Promise<{ ime: string; email: string } | null> => {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { ime: payload.ime ?? '', email: payload.email ?? '' };
  } catch {
    return null;
  }
};

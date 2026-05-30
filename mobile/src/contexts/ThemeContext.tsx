import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, type ColorPalette } from '../theme/colors';

type ThemeName = 'light' | 'dark';

type ThemeContextValue = {
  theme: ThemeName;
  colors: ColorPalette;
  toggleTheme: () => void;
  setTheme: (theme: ThemeName) => void;
};

const STORAGE_KEY = '@pandora/theme';
const DEFAULT_THEME: ThemeName = 'dark';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(DEFAULT_THEME);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!active) return;
        if (stored === 'light' || stored === 'dark') {
          setThemeState(stored);
        }
      })
      .catch(() => {
        // ignoriraj — koristi default
      });
    return () => {
      active = false;
    };
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // ignoriraj — preferencija jednostavno neće biti spremljena
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: ThemeName = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colors: theme === 'dark' ? darkColors : lightColors,
      toggleTheme,
      setTheme,
    }),
    [theme, toggleTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme mora biti unutar <ThemeProvider>');
  }
  return ctx;
}

/**
 * useThemedStyles — vraća StyleSheet objekt re-evaluiran kad se promijeni tema.
 *
 * Pattern:
 *   const styles = useThemedStyles(makeStyles);
 *   const makeStyles = (colors) => StyleSheet.create({ box: { backgroundColor: colors.bgDeep } });
 */
export function useThemedStyles<T>(factory: (colors: ColorPalette) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}

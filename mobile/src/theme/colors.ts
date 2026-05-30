// Tematske palete za light i dark mode. Glavni izvor istine.
//
// Dark paleta preuzeta iz web verzije (web/src/index.css [data-theme="dark"]).
// Light paleta zrcalna — svjetla pozadina, tamniji tekstovi, prilagođen accent.

export type ColorPalette = {
  bgDeep: string;
  bgSurface: string;
  bgCard: string;
  bgInput: string;

  borderSubtle: string;
  borderHover: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  accent: string;
  accentDark: string;
  accentSoft: string;
  accentGlow: string;

  error: string;
  errorBg: string;
  errorBorder: string;
  errorText: string;

  success: string;
  successBg: string;
  successBorder: string;
  successText: string;

  overlaySoft: string;
  overlayMedium: string;

  statusBar: 'light' | 'dark';
};

export const darkColors: ColorPalette = {
  bgDeep: '#0a0c10',
  bgSurface: '#111318',
  bgCard: '#161820',
  bgInput: '#1a1d26',

  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  borderHover: 'rgba(255, 255, 255, 0.12)',

  textPrimary: '#eef0f4',
  textSecondary: '#8a8f9c',
  textMuted: '#5c6070',

  accent: '#d4a853',
  accentDark: '#c49a3c',
  accentSoft: 'rgba(212, 168, 83, 0.12)',
  accentGlow: 'rgba(212, 168, 83, 0.25)',

  error: '#e54d4d',
  errorBg: 'rgba(229, 77, 77, 0.08)',
  errorBorder: 'rgba(229, 77, 77, 0.15)',
  errorText: '#f09090',

  success: '#5acf7a',
  successBg: 'rgba(64, 192, 96, 0.08)',
  successBorder: 'rgba(64, 192, 96, 0.2)',
  successText: '#7ed99a',

  overlaySoft: 'rgba(255, 255, 255, 0.04)',
  overlayMedium: 'rgba(0, 0, 0, 0.5)',

  statusBar: 'light',
};

export const lightColors: ColorPalette = {
  bgDeep: '#f4f6fb',
  bgSurface: '#ffffff',
  bgCard: '#ffffff',
  bgInput: '#eef1f6',

  borderSubtle: 'rgba(15, 23, 42, 0.08)',
  borderHover: 'rgba(15, 23, 42, 0.18)',

  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',

  accent: '#b8902f',
  accentDark: '#9b7a26',
  accentSoft: 'rgba(184, 144, 47, 0.14)',
  accentGlow: 'rgba(184, 144, 47, 0.28)',

  error: '#c0392b',
  errorBg: 'rgba(192, 57, 43, 0.08)',
  errorBorder: 'rgba(192, 57, 43, 0.2)',
  errorText: '#c0392b',

  success: '#1f8a3c',
  successBg: 'rgba(31, 138, 60, 0.08)',
  successBorder: 'rgba(31, 138, 60, 0.2)',
  successText: '#1f8a3c',

  overlaySoft: 'rgba(15, 23, 42, 0.04)',
  overlayMedium: 'rgba(15, 23, 42, 0.35)',

  statusBar: 'dark',
};

// Default export = dark (privremena backward-compat za module koji još nisu prešli na useThemedStyles).
// Sve nove komponente trebaju koristiti useThemedStyles iz ../contexts/ThemeContext.
export const colors = darkColors;

export const radius = {
  card: 18,
  input: 12,
  button: 12,
} as const;

// Boje preuzete iz web verzije (web/src/pages/LoginPage.css :root)
export const colors = {
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
} as const;

export const radius = {
  card: 18,
  input: 12,
  button: 12,
} as const;

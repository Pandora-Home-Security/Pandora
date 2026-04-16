// System font koristen privremeno; Outfit se moze dodati kasnije preko @expo-google-fonts/outfit.
export const typography = {
  brandTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 13,
    fontWeight: '300' as const,
    letterSpacing: 0.3,
  },
  formHeader: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  formSubheader: {
    fontSize: 13,
    fontWeight: '400' as const,
  },
  label: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  input: {
    fontSize: 15,
    fontWeight: '400' as const,
  },
  button: {
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  alert: {
    fontSize: 13,
    fontWeight: '400' as const,
  },
  footer: {
    fontSize: 13,
    fontWeight: '400' as const,
  },
  link: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
} as const;

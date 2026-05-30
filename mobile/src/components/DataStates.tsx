import type { ReactNode } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';
import { radius, type ColorPalette } from '../theme/colors';
import { typography } from '../theme/typography';

export function LoadingState({ message = 'Učitavanje...' }: { message?: string }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.accent} size="large" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

export function ErrorState({
  message = 'Došlo je do greške pri dohvaćanju podataka.',
  onRetry,
  children,
}: {
  message?: string;
  onRetry?: () => void;
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <Svg
        viewBox="0 0 24 24"
        width={48}
        height={48}
        fill="none"
        stroke={colors.error}
        strokeWidth={1.5}
      >
        <Path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </Svg>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [styles.retryBtn, pressed && styles.retryBtnPressed]}
        >
          <Svg viewBox="0 0 20 20" width={16} height={16} fill={colors.accent}>
            <Path
              fillRule="evenodd"
              d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
              clipRule="evenodd"
            />
          </Svg>
          <Text style={styles.retryText}>Pokušaj ponovno</Text>
        </Pressable>
      )}
      {children}
    </View>
  );
}

export function EmptyState({
  message,
  icon,
}: {
  message: string;
  icon?: ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      {icon ?? (
        <Svg
          viewBox="0 0 24 24"
          width={48}
          height={48}
          fill="none"
          stroke={colors.textMuted}
          strokeWidth={1.5}
          opacity={0.35}
        >
          <Path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
          />
        </Svg>
      )}
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const makeStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: 24,
      gap: 12,
    },
    text: {
      ...typography.formSubheader,
      color: colors.textMuted,
      textAlign: 'center',
    },
    errorText: {
      ...typography.formSubheader,
      color: colors.textMuted,
      textAlign: 'center',
      maxWidth: 280,
    },
    emptyText: {
      ...typography.formSubheader,
      color: colors.textMuted,
      textAlign: 'center',
      maxWidth: 280,
    },
    retryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    retryBtnPressed: {
      backgroundColor: colors.accent,
    },
    retryText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.accent,
    },
  });

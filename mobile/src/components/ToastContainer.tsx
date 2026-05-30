import { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import {
  useNotifications,
  type Toast as ToastType,
  type AlarmType,
} from '../contexts/NotificationsContext';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';
import { radius, type ColorPalette } from '../theme/colors';
import { typography } from '../theme/typography';
import type { RootStackNavigation } from '../navigation/RootStack';

const AUTO_DISMISS_MS = 6000;

const typeLabels: Record<AlarmType, string> = {
  motion: 'Pokret',
  sound: 'Zvuk',
  offline: 'Offline',
  door: 'Vrata',
  temp: 'Temperatura',
};

const typeShort: Record<AlarmType, string> = {
  motion: 'MOT',
  sound: 'SND',
  offline: 'OFF',
  door: 'DOR',
  temp: 'TMP',
};

const typeColors: Record<AlarmType, string> = {
  motion: '#facc15',
  sound: '#60a5fa',
  offline: '#9ca3af',
  door: '#fb923c',
  temp: '#f87171',
};

function Toast({ toast }: { toast: ToastType }) {
  const { dismissToast, markAsRead } = useNotifications();
  const navigation = useNavigation<RootStackNavigation>();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const slide = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => dismissToast(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, dismissToast, slide, opacity]);

  const handleOpen = () => {
    dismissToast(toast.id);
    navigation.navigate('Alarms');
  };

  const handleMarkRead = () => {
    void markAsRead(toast.alarm.id);
    dismissToast(toast.id);
  };

  const handleDismiss = () => {
    dismissToast(toast.id);
  };

  const tone = typeColors[toast.alarm.type];

  return (
    <Animated.View
      style={[
        styles.toast,
        { transform: [{ translateY: slide }], opacity, borderLeftColor: tone },
      ]}
    >
      <Pressable onPress={handleOpen} style={styles.toastPressable}>
        <View style={[styles.badge, { backgroundColor: tone }]}>
          <Text style={styles.badgeText}>{typeShort[toast.alarm.type]}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={[styles.typeLabel, { color: tone }]}>
              {typeLabels[toast.alarm.type]}
            </Text>
            <Text style={styles.camera} numberOfLines={1}>
              {toast.alarm.camera}
            </Text>
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {toast.alarm.message}
          </Text>
          <View style={styles.actions}>
            <Pressable
              onPress={handleMarkRead}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionBtnRead,
                pressed && styles.actionBtnPressed,
              ]}
              hitSlop={4}
            >
              <Text style={styles.actionBtnReadText}>Pročitano</Text>
            </Pressable>
            <Pressable
              onPress={handleOpen}
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && styles.actionBtnPressed,
              ]}
              hitSlop={4}
            >
              <Text style={styles.actionBtnText}>Otvori alarme</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={handleDismiss}
          hitSlop={10}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
        >
          <Svg viewBox="0 0 20 20" width={16} height={16} fill={colors.textMuted}>
            <Path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </Svg>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

export function ToastContainer() {
  const { toasts } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <SafeAreaView
      edges={['top']}
      pointerEvents="box-none"
      style={styles.container}
    >
      <View pointerEvents="box-none" style={styles.stack}>
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} />
        ))}
      </View>
    </SafeAreaView>
  );
}

// Statički stilovi za vanjski layout — ne ovise o temi.
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  stack: {
    paddingHorizontal: 10,
    paddingTop: 6,
    gap: 8,
  },
});

const makeStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    toast: {
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderLeftWidth: 4,
      borderRadius: radius.card,
      overflow: 'hidden',
      // shadow
      shadowColor: '#000',
      shadowOpacity: 0.5,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 12,
    },
    toastPressable: {
      flexDirection: 'row',
      padding: 12,
      gap: 10,
    },
    badge: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
      color: '#0a0c10',
    },
    body: {
      flex: 1,
      gap: 4,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    typeLabel: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    camera: {
      ...typography.label,
      color: colors.textMuted,
      flex: 1,
    },
    message: {
      ...typography.formSubheader,
      color: colors.textPrimary,
      fontWeight: '500',
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 6,
    },
    actionBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.input,
      backgroundColor: colors.bgInput,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    actionBtnRead: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    actionBtnPressed: {
      opacity: 0.7,
    },
    actionBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    actionBtnReadText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.accent,
    },
    closeBtn: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
    },
    closeBtnPressed: {
      backgroundColor: colors.bgInput,
    },
  });

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { clearAuthSession, getAuthUser } from '../lib/auth';
import type { RootStackNavigation } from '../navigation/RootStack';

type Props = {
  title: string;
  onMenuPress: () => void;
};

export function AppHeader({ title, onMenuPress }: Props) {
  const rootNav = useNavigation<RootStackNavigation>();
  const user = getAuthUser();

  const handleLogout = () => {
    clearAuthSession();
    rootNav.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={onMenuPress} hitSlop={10} style={styles.iconBtn} accessibilityLabel="Otvori izbornik">
          <Svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke={colors.textPrimary} strokeWidth={2} strokeLinecap="round">
            <Path d="M3 6h18" />
            <Path d="M3 12h18" />
            <Path d="M3 18h18" />
          </Svg>
        </Pressable>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.right}>
          {user?.ime && (
            <View style={styles.greetingWrap}>
              <Text style={styles.greetingLabel}>Pozdrav,</Text>
              <Text style={styles.greetingName} numberOfLines={1}>
                {user.ime}
              </Text>
            </View>
          )}
          <Pressable onPress={handleLogout} hitSlop={10} style={styles.iconBtn} accessibilityLabel="Odjavi se">
            <Svg viewBox="0 0 20 20" width={22} height={22} fill={colors.textPrimary}>
              <Path
                fillRule="evenodd"
                d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z"
                clipRule="evenodd"
              />
              <Path
                fillRule="evenodd"
                d="M19 10a.75.75 0 00-.22-.53l-3.25-3.25a.75.75 0 10-1.06 1.06l1.97 1.97H8.75a.75.75 0 000 1.5h7.69l-1.97 1.97a.75.75 0 101.06 1.06l3.25-3.25A.75.75 0 0019 10z"
                clipRule="evenodd"
              />
            </Svg>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  header: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.formHeader,
    color: colors.textPrimary,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greetingWrap: {
    alignItems: 'flex-end',
    maxWidth: 120,
  },
  greetingLabel: {
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  greetingName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
});

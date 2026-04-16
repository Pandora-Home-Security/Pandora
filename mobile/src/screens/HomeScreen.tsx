import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import type { AuthStackParamList } from '../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Home'>;

// Privremeni placeholder. Bit ce zamijenjen pravim Dashboard / tab navigatorom kasnije.
export function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Početna</Text>
        <Text style={styles.subtitle}>
          Placeholder ekran nakon prijave. Dashboard, kamere, alarmi i ostalo dolaze u sljedećim
          milestonovima.
        </Text>
        <Pressable
          onPress={() => navigation.replace('Login', {})}
          style={styles.logoutBtn}
          hitSlop={8}
        >
          <Text style={styles.logoutText}>Odjavi se</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  title: {
    ...typography.brandTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.formSubheader,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  logoutBtn: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  logoutText: {
    ...typography.link,
    color: colors.accent,
  },
});

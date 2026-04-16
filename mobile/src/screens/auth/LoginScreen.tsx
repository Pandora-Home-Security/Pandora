import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrandHeader } from '../../components/BrandHeader';
import { Input } from '../../components/Input';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Alert } from '../../components/Alert';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation, route }: Props) {
  const justRegistered = route.params?.justRegistered === true;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    if (!email.trim()) {
      setError('Email adresa je obavezna.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Unesite ispravnu email adresu.');
      return false;
    }
    if (!password) {
      setError('Lozinka je obavezna.');
      return false;
    }
    if (password.length < 8) {
      setError('Lozinka mora imati najmanje 8 znakova.');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    setError('');
    if (!validate()) return;

    setLoading(true);
    // TODO: API poziv (apiFetch '/api/auth/login') + spremanje tokena u SecureStore.
    // Za sada samo simulacija — sljedeci korak ce zamijeniti ovo s pravim auth flow-om.
    setTimeout(() => {
      setLoading(false);
      navigation.replace('Home');
    }, 700);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BrandHeader />

          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Dobrodošli natrag</Text>
              <Text style={styles.subtitle}>Prijavite se u svoj račun</Text>
            </View>

            {justRegistered && !error && (
              <Alert variant="success" message="Račun uspješno stvoren. Možete se prijaviti." />
            )}
            {!!error && <Alert variant="error" message={error} />}

            <Input
              label="Email adresa"
              icon="mail"
              placeholder="ime@primjer.com"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
            />

            <Input
              label="Lozinka"
              icon="lock"
              placeholder="Unesite lozinku"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setError('');
              }}
              autoCapitalize="none"
              autoComplete="password"
              isPassword
            />

            <PrimaryButton label="Prijavi se" onPress={handleSubmit} loading={loading} />

            <View style={styles.footer}>
              <View style={styles.footerLine} />
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Nemate račun? </Text>
                <Pressable onPress={() => navigation.navigate('Register')} hitSlop={8}>
                  <Text style={styles.link}>Registrirajte se</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 18,
    padding: 22,
  },
  header: {
    marginBottom: 22,
  },
  title: {
    ...typography.formHeader,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.formSubheader,
    color: colors.textSecondary,
  },
  footer: {
    marginTop: 24,
  },
  footerLine: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...typography.footer,
    color: colors.textMuted,
  },
  link: {
    ...typography.link,
    color: colors.accent,
  },
});

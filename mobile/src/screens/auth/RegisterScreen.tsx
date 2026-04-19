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
import { apiFetch } from '../../lib/api';
import type { RootStackParamList } from '../../navigation/RootStack';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const [ime, setIme] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    if (!ime.trim()) {
      setError('Ime je obavezno.');
      return false;
    }
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
    if (!passwordConfirm) {
      setError('Potvrda lozinke je obavezna.');
      return false;
    }
    if (password !== passwordConfirm) {
      setError('Lozinke se ne poklapaju.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ime, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Greška pri stvaranju računa.');
        return;
      }
      navigation.replace('Login', { justRegistered: true });
    } catch {
      setError('Greška pri povezivanju sa serverom.');
    } finally {
      setLoading(false);
    }
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
              <Text style={styles.title}>Stvori račun</Text>
              <Text style={styles.subtitle}>Pridružite se Pandora sustavu</Text>
            </View>

            {!!error && <Alert variant="error" message={error} />}

            <Input
              label="Ime"
              icon="user"
              placeholder="Vaše ime"
              value={ime}
              onChangeText={(v) => {
                setIme(v);
                setError('');
              }}
              autoComplete="name"
            />

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
              placeholder="Najmanje 8 znakova"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setError('');
              }}
              autoCapitalize="none"
              autoComplete="password-new"
              isPassword
            />

            <Input
              label="Potvrda lozinke"
              icon="lock-confirm"
              placeholder="Ponovite lozinku"
              value={passwordConfirm}
              onChangeText={(v) => {
                setPasswordConfirm(v);
                setError('');
              }}
              autoCapitalize="none"
              autoComplete="password-new"
              isPassword
            />

            <PrimaryButton label="Registriraj se" onPress={handleSubmit} loading={loading} />

            <View style={styles.footer}>
              <View style={styles.footerLine} />
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Već imate račun? </Text>
                <Pressable onPress={() => navigation.navigate('Login', {})} hitSlop={8}>
                  <Text style={styles.link}>Prijavite se</Text>
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

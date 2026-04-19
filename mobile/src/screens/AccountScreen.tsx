import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiFetch } from '../lib/api';
import { getAuthUser, setAuthSession, clearAuthSession } from '../lib/auth';
import { AppScreenLayout } from '../components/AppScreenLayout';
import { colors, radius } from '../theme/colors';
import { typography } from '../theme/typography';
import type { RootStackParamList, RootStackNavigation } from '../navigation/RootStack';

type Props = NativeStackScreenProps<RootStackParamList, 'Account'>;

type AlertState = { type: 'success' | 'error'; message: string } | null;

function decodeTokenUser(token: string): { id: string; ime: string; email: string } | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.id ?? '', ime: payload.ime ?? '', email: payload.email ?? '' };
  } catch {
    return null;
  }
}

export function AccountScreen({ navigation: _navigation }: Props) {
  const rootNav = useNavigation<RootStackNavigation>();
  const currentUser = getAuthUser();

  const redirectToLogin = () => {
    clearAuthSession();
    rootNav.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const [ime, setIme] = useState(currentUser?.ime ?? '');
  const [email, setEmail] = useState(currentUser?.email ?? '');
  const [profileAlert, setProfileAlert] = useState<AlertState>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [staraLozinka, setStaraLozinka] = useState('');
  const [novaLozinka, setNovaLozinka] = useState('');
  const [potvrda, setPotvrda] = useState('');
  const [passwordAlert, setPasswordAlert] = useState<AlertState>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileSubmit = async () => {
    if (!ime.trim() || !email.trim()) {
      setProfileAlert({ type: 'error', message: 'Ime i email su obavezni.' });
      return;
    }

    setProfileAlert(null);
    setProfileLoading(true);

    try {
      const res = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        includeAuth: true,
        body: JSON.stringify({ ime: ime.trim(), email: email.trim() }),
      });

      const data = await res.json();

      if (res.status === 401) {
        redirectToLogin();
        return;
      }

      if (!res.ok) {
        setProfileAlert({ type: 'error', message: data.message ?? 'Greška pri ažuriranju profila.' });
        return;
      }

      if (data.token) {
        const decoded = decodeTokenUser(data.token);
        if (decoded) {
          setAuthSession(data.token, decoded);
        }
      }

      setProfileAlert({ type: 'success', message: data.message ?? 'Profil uspješno ažuriran.' });
    } catch {
      setProfileAlert({ type: 'error', message: 'Nije moguće spojiti se na server.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    setPasswordAlert(null);

    if (novaLozinka !== potvrda) {
      setPasswordAlert({ type: 'error', message: 'Nova lozinka i potvrda se ne podudaraju.' });
      return;
    }

    if (novaLozinka.length < 8) {
      setPasswordAlert({ type: 'error', message: 'Nova lozinka mora imati najmanje 8 znakova.' });
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await apiFetch('/api/auth/password', {
        method: 'PUT',
        includeAuth: true,
        body: JSON.stringify({ staraLozinka, novaLozinka }),
      });

      const data = await res.json();

      if (res.status === 401) {
        redirectToLogin();
        return;
      }

      if (!res.ok) {
        setPasswordAlert({ type: 'error', message: data.message ?? 'Greška pri promjeni lozinke.' });
        return;
      }

      setPasswordAlert({ type: 'success', message: data.message ?? 'Lozinka uspješno promijenjena.' });
      setStaraLozinka('');
      setNovaLozinka('');
      setPotvrda('');
    } catch {
      setPasswordAlert({ type: 'error', message: 'Nije moguće spojiti se na server.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <AppScreenLayout title="Moj račun">
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => rootNav.navigate('Dashboard')}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Text style={styles.backText}>← Dashboard</Text>
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View>
            <Text style={styles.title}>Moj račun</Text>
            <Text style={styles.subtitle}>Upravljajte podacima i lozinkom</Text>
          </View>
        </View>

        {/* Kartica — osobni podaci */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Osobni podaci</Text>

          <View style={styles.currentBox}>
            <View style={styles.currentRow}>
              <Text style={styles.currentLabel}>Ime</Text>
              <Text style={styles.currentValue}>{currentUser?.ime || '—'}</Text>
            </View>
            <View style={styles.currentRow}>
              <Text style={styles.currentLabel}>Email</Text>
              <Text style={styles.currentValue} numberOfLines={1}>{currentUser?.email || '—'}</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Novo ime</Text>
            <TextInput
              style={styles.input}
              value={ime}
              onChangeText={setIme}
              placeholder="Unesite ime"
              placeholderTextColor={colors.textMuted}
              autoComplete="name"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Novi email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Unesite email adresu"
              placeholderTextColor={colors.textMuted}
              autoComplete="email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {profileAlert && (
            <View style={[styles.alertBox, profileAlert.type === 'success' ? styles.alertSuccess : styles.alertError]}>
              <Text style={[styles.alertText, profileAlert.type === 'success' ? styles.alertTextSuccess : styles.alertTextError]}>
                {profileAlert.message}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, profileLoading && styles.btnDisabled]}
            onPress={handleProfileSubmit}
            disabled={profileLoading}
          >
            {profileLoading
              ? <ActivityIndicator color={colors.bgDeep} />
              : <Text style={styles.btnText}>Spremi promjene</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Kartica — promjena lozinke */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Promjena lozinke</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Stara lozinka</Text>
            <TextInput
              style={styles.input}
              value={staraLozinka}
              onChangeText={setStaraLozinka}
              placeholder="Unesite trenutnu lozinku"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoComplete="current-password"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nova lozinka</Text>
            <TextInput
              style={styles.input}
              value={novaLozinka}
              onChangeText={setNovaLozinka}
              placeholder="Najmanje 8 znakova"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Potvrda nove lozinke</Text>
            <TextInput
              style={styles.input}
              value={potvrda}
              onChangeText={setPotvrda}
              placeholder="Ponovite novu lozinku"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          {passwordAlert && (
            <View style={[styles.alertBox, passwordAlert.type === 'success' ? styles.alertSuccess : styles.alertError]}>
              <Text style={[styles.alertText, passwordAlert.type === 'success' ? styles.alertTextSuccess : styles.alertTextError]}>
                {passwordAlert.message}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, passwordLoading && styles.btnDisabled]}
            onPress={handlePasswordSubmit}
            disabled={passwordLoading}
          >
            {passwordLoading
              ? <ActivityIndicator color={colors.bgDeep} />
              : <Text style={styles.btnText}>Promijeni lozinku</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
    </AppScreenLayout>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    gap: 10,
    marginBottom: 8,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  backText: {
    ...typography.link,
    color: colors.accent,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
  },
  title: {
    ...typography.formHeader,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.formSubheader,
    color: colors.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.card,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    ...typography.formSubheader,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  currentBox: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.input,
    padding: 12,
    gap: 8,
  },
  currentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentLabel: {
    ...typography.formSubheader,
    color: colors.textMuted,
  },
  currentValue: {
    ...typography.formSubheader,
    color: colors.textPrimary,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  field: {
    gap: 4,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.input,
    color: colors.textPrimary,
    ...typography.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  alertBox: {
    padding: 12,
    borderRadius: radius.input,
    borderWidth: 1,
  },
  alertSuccess: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
  },
  alertError: {
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
  },
  alertText: {
    ...typography.alert,
  },
  alertTextSuccess: {
    color: colors.successText,
  },
  alertTextError: {
    color: colors.errorText,
  },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    ...typography.button,
    color: colors.bgDeep,
  },
});

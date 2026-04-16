import { useState, useEffect, useCallback } from 'react';
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
import { apiFetch } from '../lib/api';
import { decodeToken, setAuthToken, clearAuthToken } from '../lib/auth';

type AlertState = { type: 'success' | 'error'; message: string } | null;

export default function AccountScreen() {
  const [currentIme, setCurrentIme] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');

  const [ime, setIme] = useState('');
  const [email, setEmail] = useState('');
  const [profileAlert, setProfileAlert] = useState<AlertState>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [staraLozinka, setStaraLozinka] = useState('');
  const [novaLozinka, setNovaLozinka] = useState('');
  const [potvrda, setPotvrda] = useState('');
  const [passwordAlert, setPasswordAlert] = useState<AlertState>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const loadUser = useCallback(async () => {
    const user = await decodeToken();
    if (user) {
      setCurrentIme(user.ime);
      setCurrentEmail(user.email);
      setIme(user.ime);
      setEmail(user.email);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

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
        await clearAuthToken();
        Alert.alert('Sesija istekla', 'Molimo prijavite se ponovo.');
        return;
      }

      if (!res.ok) {
        setProfileAlert({ type: 'error', message: data.message ?? 'Greška pri ažuriranju profila.' });
        return;
      }

      if (data.token) {
        await setAuthToken(data.token);
      }

      setCurrentIme(ime.trim());
      setCurrentEmail(email.trim());
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
        await clearAuthToken();
        Alert.alert('Sesija istekla', 'Molimo prijavite se ponovo.');
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
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
            <Text style={styles.currentValue}>{currentIme || '—'}</Text>
          </View>
          <View style={styles.currentRow}>
            <Text style={styles.currentLabel}>Email</Text>
            <Text style={styles.currentValue} numberOfLines={1}>{currentEmail || '—'}</Text>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Novo ime</Text>
          <TextInput
            style={styles.input}
            value={ime}
            onChangeText={setIme}
            placeholder="Unesite ime"
            placeholderTextColor="#555"
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
            placeholderTextColor="#555"
            autoComplete="email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {profileAlert && (
          <View style={[styles.alert, profileAlert.type === 'success' ? styles.alertSuccess : styles.alertError]}>
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
            ? <ActivityIndicator color="#0a0c10" />
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
            placeholderTextColor="#555"
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
            placeholderTextColor="#555"
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
            placeholderTextColor="#555"
            secureTextEntry
            autoComplete="new-password"
          />
        </View>

        {passwordAlert && (
          <View style={[styles.alert, passwordAlert.type === 'success' ? styles.alertSuccess : styles.alertError]}>
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
            ? <ActivityIndicator color="#0a0c10" />
            : <Text style={styles.btnText}>Promijeni lozinku</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const ACCENT = '#d4a843';
const BG = '#0a0c10';
const BG_CARD = '#111318';
const BG_INPUT = '#0f1117';
const BORDER = '#1e2130';
const TEXT_PRIMARY = '#e8eaf0';
const TEXT_MUTED = '#5a6070';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: BG_CARD,
    borderWidth: 1,
    borderColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  card: {
    backgroundColor: BG_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  currentBox: {
    backgroundColor: BG_INPUT,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  currentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentLabel: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  currentValue: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  field: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8890a0',
  },
  input: {
    backgroundColor: BG_INPUT,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    color: TEXT_PRIMARY,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  alert: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  alertSuccess: {
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderColor: 'rgba(74,222,128,0.25)',
  },
  alertError: {
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderColor: 'rgba(248,113,113,0.25)',
  },
  alertText: {
    fontSize: 13,
    lineHeight: 18,
  },
  alertTextSuccess: {
    color: '#4ade80',
  },
  alertTextError: {
    color: '#f87171',
  },
  btn: {
    backgroundColor: ACCENT,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#0a0c10',
    fontSize: 14,
    fontWeight: '600',
  },
});

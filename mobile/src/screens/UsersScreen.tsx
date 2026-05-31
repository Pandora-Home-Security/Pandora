import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { AppScreenLayout } from '../components/AppScreenLayout';
import { LoadingState, ErrorState, EmptyState } from '../components/DataStates';
import { ConfirmModal } from '../components/ConfirmModal';
import { apiFetch } from '../lib/api';
import { clearAuthSession, getAuthUser, getUserRole } from '../lib/auth';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';
import { radius, type ColorPalette } from '../theme/colors';
import { typography } from '../theme/typography';
import type { RootStackNavigation } from '../navigation/RootStack';

/* ===== Tipovi ===== */
type UserRole = 'admin' | 'korisnik';

type AppUser = {
  id: string;
  ime: string;
  email: string;
  role: UserRole;
  created_at: string;
};

/* ===== Pomoćne funkcije ===== */
function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'upravo';
  if (mins < 60) return `prije ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `prije ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `prije ${days} d`;
}

const AVATAR_COLORS = [
  '#34d399',
  '#60a5fa',
  '#a78bfa',
  '#fb923c',
  '#f87171',
  '#fbbf24',
  '#e879f9',
  '#22d3ee',
  '#4ade80',
  '#f472b6',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ===== Komponenta ===== */
export function UsersScreen() {
  const rootNav = useNavigation<RootStackNavigation>();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const currentUser = getAuthUser();
  const currentRole = getUserRole();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [inviteIme, setInviteIme] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('korisnik');
  const [inviteError, setInviteError] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Actions modal (tap on user → choose action)
  const [actionTarget, setActionTarget] = useState<AppUser | null>(null);
  const [roleLoadingId, setRoleLoadingId] = useState<string | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);

  /* --- Dohvat korisnika --- */
  const fetchUsers = useCallback(async () => {
    try {
      setError('');
      const res = await apiFetch('/api/users', { includeAuth: true });
      if (res.status === 401) {
        clearAuthSession();
        rootNav.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
      if (res.status === 403) {
        setError('Nemate administratorske ovlasti.');
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Greška pri dohvaćanju korisnika.');
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri dohvaćanju korisnika.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rootNav]);

  useEffect(() => {
    if (currentRole === 'admin') {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [currentRole, fetchUsers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, [fetchUsers]);

  /* --- Filtriranje --- */
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.ime.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, searchQuery]);

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const korisnikCount = users.filter((u) => u.role === 'korisnik').length;

  /* --- Invite --- */
  const handleInvite = async () => {
    if (!inviteIme.trim() || !inviteEmail.trim() || invitePassword.length < 8) {
      setInviteError('Ispuni sva polja (lozinka mora imati barem 8 znakova).');
      return;
    }
    setInviteError('');
    setInviteLoading(true);
    try {
      const res = await apiFetch('/api/users/invite', {
        method: 'POST',
        includeAuth: true,
        body: JSON.stringify({
          ime: inviteIme.trim(),
          email: inviteEmail.trim(),
          password: invitePassword,
          role: inviteRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.message ?? 'Greška pri dodavanju korisnika.');
        return;
      }
      setUsers((prev) => [data.user, ...prev]);
      setShowInvite(false);
      setInviteIme('');
      setInviteEmail('');
      setInvitePassword('');
      setInviteRole('korisnik');
    } catch {
      setInviteError('Mrežna greška.');
    } finally {
      setInviteLoading(false);
    }
  };

  /* --- Promjena uloge --- */
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setRoleLoadingId(userId);
    try {
      const res = await apiFetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        includeAuth: true,
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Greška pri promjeni uloge.');
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      setActionTarget(null);
    } catch {
      setError('Mrežna greška.');
    } finally {
      setRoleLoadingId(null);
    }
  };

  /* --- Brisanje --- */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await apiFetch(`/api/users/${deleteTarget.id}`, {
      method: 'DELETE',
      includeAuth: true,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? 'Greška pri brisanju.');
    }
    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    setDeleteTarget(null);
    setActionTarget(null);
  };

  /* --- Pristup zabranjen --- */
  if (currentRole !== 'admin') {
    return (
      <AppScreenLayout title="Korisnici">
        <View style={styles.noAccess}>
          <Svg viewBox="0 0 24 24" width={56} height={56} fill="none" stroke={colors.textMuted} strokeWidth={1.5}>
            <Path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </Svg>
          <Text style={styles.noAccessTitle}>Pristup odbijen</Text>
          <Text style={styles.noAccessText}>Samo administratori mogu upravljati korisnicima.</Text>
        </View>
      </AppScreenLayout>
    );
  }

  /* --- Render --- */
  return (
    <AppScreenLayout title="Korisnici">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* Heading + stats */}
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Upravljanje korisnicima</Text>
          <Text style={styles.subtitle}>Dodajte korisnike, mijenjajte uloge i upravljajte pristupom.</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statDot, { backgroundColor: colors.accent }]} />
              <Text style={styles.statLabel}>Admini</Text>
              <Text style={styles.statValue}>{adminCount}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statDot, { backgroundColor: colors.textSecondary }]} />
              <Text style={styles.statLabel}>Korisnici</Text>
              <Text style={styles.statValue}>{korisnikCount}</Text>
            </View>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Svg viewBox="0 0 20 20" width={16} height={16} fill="none" stroke={colors.textMuted} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={styles.searchIcon}>
            <Circle cx={9} cy={9} r={6} />
            <Path d="M14 14l4 4" />
          </Svg>
          <TextInput
            style={styles.searchInput}
            placeholder="Pretraži po imenu ili emailu…"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Pretraživanje korisnika"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={10}
              style={styles.searchClear}
              accessibilityLabel="Očisti pretraživanje"
            >
              <Svg viewBox="0 0 20 20" width={18} height={18} fill={colors.textMuted}>
                <Path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.7 7.3a1 1 0 00-1.4 1.4L8.6 10l-1.3 1.3a1 1 0 101.4 1.4L10 11.4l1.3 1.3a1 1 0 001.4-1.4L11.4 10l1.3-1.3a1 1 0 00-1.4-1.4L10 8.6 8.7 7.3z" clipRule="evenodd" />
              </Svg>
            </Pressable>
          )}
        </View>

        {/* Sadržaj */}
        {loading ? (
          <LoadingState message="Učitavanje korisnika..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchUsers} />
        ) : users.length === 0 ? (
          <EmptyState message="Nema registriranih korisnika." />
        ) : filteredUsers.length === 0 ? (
          <EmptyState message={`Nema rezultata za "${searchQuery}".`} />
        ) : (
          <View style={styles.list}>
            {filteredUsers.map((user) => {
              const isMe = user.id === currentUser?.id;
              return (
                <Pressable
                  key={user.id}
                  onPress={() => !isMe && setActionTarget(user)}
                  style={({ pressed }) => [styles.userCard, pressed && !isMe && styles.userCardPressed]}
                  disabled={isMe}
                >
                  <View style={[styles.avatar, { backgroundColor: avatarColor(user.ime) }]}>
                    <Text style={styles.avatarText}>{getInitials(user.ime)}</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {user.ime}
                      </Text>
                      {isMe && (
                        <View style={styles.meBadge}>
                          <Text style={styles.meBadgeText}>Ti</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.userEmail} numberOfLines={1}>
                      {user.email}
                    </Text>
                    <Text style={styles.userMeta}>
                      Registriran {relativeTime(user.created_at)}
                    </Text>
                  </View>
                  <View style={styles.userTrailing}>
                    <View
                      style={[
                        styles.rolePill,
                        user.role === 'admin' ? styles.rolePillAdmin : styles.rolePillUser,
                      ]}
                    >
                      <Text
                        style={[
                          styles.rolePillText,
                          user.role === 'admin' ? styles.rolePillTextAdmin : styles.rolePillTextUser,
                        ]}
                      >
                        {user.role === 'admin' ? 'Admin' : 'Korisnik'}
                      </Text>
                    </View>
                    {!isMe && (
                      <Svg viewBox="0 0 20 20" width={16} height={16} fill="none" stroke={colors.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M7 5l6 5-6 5" />
                      </Svg>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating "Dodaj korisnika" button */}
      <Pressable
        onPress={() => setShowInvite(true)}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        accessibilityLabel="Dodaj korisnika"
      >
        <Svg viewBox="0 0 20 20" width={22} height={22} fill={colors.bgDeep}>
          <Path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
        </Svg>
      </Pressable>

      {/* Invite modal */}
      <Modal
        visible={showInvite}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInvite(false)}
        statusBarTranslucent
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowInvite(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Dodaj novog korisnika</Text>

            {inviteError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{inviteError}</Text>
              </View>
            ) : null}

            <Text style={styles.modalLabel}>Ime</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ivan Horvat"
              placeholderTextColor={colors.textMuted}
              value={inviteIme}
              onChangeText={setInviteIme}
              editable={!inviteLoading}
            />

            <Text style={styles.modalLabel}>Email</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="ivan@primjer.hr"
              placeholderTextColor={colors.textMuted}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!inviteLoading}
            />

            <Text style={styles.modalLabel}>Lozinka</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Najmanje 8 znakova"
              placeholderTextColor={colors.textMuted}
              value={invitePassword}
              onChangeText={setInvitePassword}
              secureTextEntry
              editable={!inviteLoading}
            />

            <Text style={styles.modalLabel}>Uloga</Text>
            <View style={styles.roleSegment}>
              <Pressable
                onPress={() => setInviteRole('korisnik')}
                style={[
                  styles.roleSegmentBtn,
                  inviteRole === 'korisnik' && styles.roleSegmentBtnActive,
                ]}
                disabled={inviteLoading}
              >
                <Text
                  style={[
                    styles.roleSegmentText,
                    inviteRole === 'korisnik' && styles.roleSegmentTextActive,
                  ]}
                >
                  Korisnik
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setInviteRole('admin')}
                style={[
                  styles.roleSegmentBtn,
                  inviteRole === 'admin' && styles.roleSegmentBtnActive,
                ]}
                disabled={inviteLoading}
              >
                <Text
                  style={[
                    styles.roleSegmentText,
                    inviteRole === 'admin' && styles.roleSegmentTextActive,
                  ]}
                >
                  Admin
                </Text>
              </Pressable>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowInvite(false)}
                style={({ pressed }) => [styles.modalBtn, styles.modalBtnCancel, pressed && styles.modalBtnPressed]}
                disabled={inviteLoading}
              >
                <Text style={styles.modalBtnCancelText}>Odustani</Text>
              </Pressable>
              <Pressable
                onPress={handleInvite}
                style={({ pressed }) => [styles.modalBtn, styles.modalBtnPrimary, pressed && styles.modalBtnPressed]}
                disabled={inviteLoading}
              >
                {inviteLoading ? (
                  <ActivityIndicator color={colors.bgDeep} />
                ) : (
                  <Text style={styles.modalBtnPrimaryText}>Dodaj</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Actions modal: promjena uloge / brisanje */}
      <Modal
        visible={!!actionTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setActionTarget(null)}
        statusBarTranslucent
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setActionTarget(null)} />
          {actionTarget && (
            <View style={styles.actionsCard}>
              <Text style={styles.actionsTitle}>{actionTarget.ime}</Text>
              <Text style={styles.actionsEmail}>{actionTarget.email}</Text>

              <Text style={styles.actionsSection}>Promijeni ulogu</Text>
              <View style={styles.roleSegment}>
                <Pressable
                  onPress={() => handleRoleChange(actionTarget.id, 'korisnik')}
                  style={[
                    styles.roleSegmentBtn,
                    actionTarget.role === 'korisnik' && styles.roleSegmentBtnActive,
                  ]}
                  disabled={roleLoadingId === actionTarget.id}
                >
                  <Text
                    style={[
                      styles.roleSegmentText,
                      actionTarget.role === 'korisnik' && styles.roleSegmentTextActive,
                    ]}
                  >
                    Korisnik
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleRoleChange(actionTarget.id, 'admin')}
                  style={[
                    styles.roleSegmentBtn,
                    actionTarget.role === 'admin' && styles.roleSegmentBtnActive,
                  ]}
                  disabled={roleLoadingId === actionTarget.id}
                >
                  <Text
                    style={[
                      styles.roleSegmentText,
                      actionTarget.role === 'admin' && styles.roleSegmentTextActive,
                    ]}
                  >
                    Admin
                  </Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => {
                  setDeleteTarget(actionTarget);
                }}
                style={({ pressed }) => [styles.deleteBtn, pressed && styles.modalBtnPressed]}
              >
                <Svg viewBox="0 0 20 20" width={16} height={16} fill={colors.error}>
                  <Path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </Svg>
                <Text style={styles.deleteBtnText}>Obriši korisnika</Text>
              </Pressable>

              <Pressable
                onPress={() => setActionTarget(null)}
                style={({ pressed }) => [styles.modalBtn, styles.modalBtnCancel, pressed && styles.modalBtnPressed, { marginTop: 8 }]}
              >
                <Text style={styles.modalBtnCancelText}>Zatvori</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>

      {/* Confirm delete */}
      <ConfirmModal
        visible={!!deleteTarget}
        title="Obriši korisnika"
        message={`Jeste li sigurni da želite obrisati korisnika "${deleteTarget?.ime}"? Ova radnja se ne može poništiti.`}
        confirmText="Obriši"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppScreenLayout>
  );
}

const makeStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    scrollContent: {
      padding: 16,
      paddingBottom: 96,
    },
    headerBlock: {
      marginBottom: 16,
    },
    title: {
      ...typography.formHeader,
      color: colors.textPrimary,
      fontSize: 22,
      marginBottom: 4,
    },
    subtitle: {
      ...typography.formSubheader,
      color: colors.textSecondary,
      marginBottom: 14,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    statCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radius.card,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    statDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statLabel: {
      ...typography.label,
      color: colors.textSecondary,
      flex: 1,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },

    /* Search */
    searchWrap: {
      position: 'relative',
      marginBottom: 14,
      justifyContent: 'center',
    },
    searchIcon: {
      position: 'absolute',
      left: 14,
      zIndex: 1,
    },
    searchInput: {
      backgroundColor: colors.bgInput,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radius.input,
      paddingVertical: 11,
      paddingLeft: 40,
      paddingRight: 36,
      color: colors.textPrimary,
      fontSize: 14,
    },
    searchClear: {
      position: 'absolute',
      right: 10,
    },

    /* List */
    list: {
      gap: 8,
    },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radius.card,
      padding: 12,
    },
    userCardPressed: {
      backgroundColor: colors.bgInput,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#0a0c10',
    },
    userInfo: {
      flex: 1,
      minWidth: 0,
    },
    userNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    userName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      flexShrink: 1,
    },
    meBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: colors.accentSoft,
    },
    meBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.accent,
      letterSpacing: 0.3,
    },
    userEmail: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    userMeta: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    userTrailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    rolePill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
    },
    rolePillAdmin: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    rolePillUser: {
      backgroundColor: colors.bgInput,
      borderColor: colors.borderSubtle,
    },
    rolePillText: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    rolePillTextAdmin: {
      color: colors.accent,
    },
    rolePillTextUser: {
      color: colors.textSecondary,
    },

    /* No access */
    noAccess: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 12,
    },
    noAccessTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      marginTop: 8,
    },
    noAccessText: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },

    /* FAB */
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    fabPressed: {
      opacity: 0.85,
    },

    /* Modali */
    modalBackdrop: {
      flex: 1,
      backgroundColor: colors.overlayMedium,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    modalCard: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radius.card,
      padding: 20,
    },
    modalTitle: {
      ...typography.formHeader,
      color: colors.textPrimary,
      marginBottom: 14,
    },
    modalLabel: {
      ...typography.label,
      color: colors.textSecondary,
      marginBottom: 6,
      marginTop: 10,
    },
    modalInput: {
      backgroundColor: colors.bgInput,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radius.input,
      paddingVertical: 10,
      paddingHorizontal: 12,
      color: colors.textPrimary,
      fontSize: 14,
    },
    errorBanner: {
      backgroundColor: colors.errorBg,
      borderWidth: 1,
      borderColor: colors.errorBorder,
      borderRadius: radius.input,
      padding: 10,
      marginBottom: 6,
    },
    errorBannerText: {
      color: colors.errorText,
      fontSize: 12,
    },

    roleSegment: {
      flexDirection: 'row',
      backgroundColor: colors.bgInput,
      borderRadius: radius.input,
      padding: 4,
      gap: 4,
    },
    roleSegmentBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: radius.input - 2,
      alignItems: 'center',
    },
    roleSegmentBtnActive: {
      backgroundColor: colors.accent,
    },
    roleSegmentText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    roleSegmentTextActive: {
      color: colors.bgDeep,
      fontWeight: '700',
    },

    modalActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 18,
    },
    modalBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: radius.button,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalBtnPressed: {
      opacity: 0.85,
    },
    modalBtnCancel: {
      backgroundColor: colors.bgInput,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    modalBtnCancelText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '500',
    },
    modalBtnPrimary: {
      backgroundColor: colors.accent,
    },
    modalBtnPrimaryText: {
      color: colors.bgDeep,
      fontSize: 14,
      fontWeight: '700',
    },

    /* Actions modal */
    actionsCard: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radius.card,
      padding: 20,
    },
    actionsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    actionsEmail: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
      marginBottom: 16,
    },
    actionsSection: {
      ...typography.label,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    deleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 14,
      paddingVertical: 12,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: colors.errorBorder,
      backgroundColor: colors.errorBg,
    },
    deleteBtnText: {
      color: colors.errorText,
      fontSize: 14,
      fontWeight: '600',
    },
  });

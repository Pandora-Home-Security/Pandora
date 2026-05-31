import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { clearAuthToken, getAuthToken } from '../lib/auth';
import { LoadingState, ErrorState, EmptyState } from '../components/DataStates';
import ConfirmModal from '../components/ConfirmModal';
import './UsersPage.css';

/* ===== Tipovi ===== */
type UserRole = 'admin' | 'korisnik';

type User = {
  id: string;
  ime: string;
  email: string;
  role: UserRole;
  created_at: string;
};

/* ===== Pomoćne funkcije ===== */
function getCurrentUserId(): string | null {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}

function getCurrentUserRole(): UserRole | null {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || 'korisnik';
  } catch {
    return null;
  }
}

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
  '#34d399', '#60a5fa', '#a78bfa', '#fb923c', '#f87171',
  '#fbbf24', '#e879f9', '#22d3ee', '#4ade80', '#f472b6',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ===== Komponenta ===== */
function UsersPage() {
  const navigate = useNavigate();
  const currentUserId = getCurrentUserId();
  const currentRole = getCurrentUserRole();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ ime: '', email: '', password: '', role: 'korisnik' as UserRole });
  const [inviteError, setInviteError] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  // Role change loading
  const [roleLoading, setRoleLoading] = useState<string | null>(null);

  /* --- Dohvat korisnika --- */
  const fetchUsers = useCallback(async () => {
    try {
      setError('');
      const res = await apiFetch('/api/users', { includeAuth: true });
      if (res.status === 401) {
        clearAuthToken();
        navigate('/login', { replace: true });
        return;
      }
      if (res.status === 403) {
        setError('Nemate administratorske ovlasti.');
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Greška pri dohvaćanju korisnika.');
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri dohvaćanju korisnika.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /* --- Pozivanje korisnika --- */
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteLoading(true);
    try {
      const res = await apiFetch('/api/users/invite', {
        method: 'POST',
        includeAuth: true,
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.message || 'Greška pri dodavanju korisnika.');
        return;
      }
      setUsers((prev) => [data.user, ...prev]);
      setShowInvite(false);
      setInviteForm({ ime: '', email: '', password: '', role: 'korisnik' });
    } catch {
      setInviteError('Mrežna greška.');
    } finally {
      setInviteLoading(false);
    }
  };

  /* --- Promjena uloge --- */
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setRoleLoading(userId);
    try {
      const res = await apiFetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        includeAuth: true,
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Greška pri promjeni uloge.');
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch {
      alert('Mrežna greška.');
    } finally {
      setRoleLoading(null);
    }
  };

  /* --- Brisanje korisnika --- */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await apiFetch(`/api/users/${deleteTarget.id}`, {
      method: 'DELETE',
      includeAuth: true,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Greška pri brisanju.');
    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  /* --- Provjera admin pristupa --- */
  if (currentRole !== 'admin' && !loading) {
    return (
      <div className="users-no-access">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <h2>Pristup odbijen</h2>
        <p>Samo administratori mogu upravljati korisnicima.</p>
      </div>
    );
  }

  /* --- Render --- */
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const userCount = users.filter((u) => u.role === 'korisnik').length;

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const filteredUsers = trimmedQuery
    ? users.filter(
        (u) =>
          u.ime.toLowerCase().includes(trimmedQuery) ||
          u.email.toLowerCase().includes(trimmedQuery),
      )
    : users;

  return (
    <>
      {/* Zaglavlje */}
      <div className="users-header">
        <div className="users-header-left">
          <h1 className="users-title">Upravljanje korisnicima</h1>
          <p className="users-subtitle">Dodajte nove korisnike, mijenjajte uloge i upravljajte pristupom.</p>
        </div>
        <div className="users-header-right">
          <div className="users-stat-card">
            <span className="users-stat-dot users-stat-dot-admin" />
            <span className="users-stat-label">Admini</span>
            <span className="users-stat-value">{adminCount}</span>
          </div>
          <div className="users-stat-card">
            <span className="users-stat-dot users-stat-dot-user" />
            <span className="users-stat-label">Korisnici</span>
            <span className="users-stat-value">{userCount}</span>
          </div>
          <button className="users-add-btn" onClick={() => setShowInvite(true)}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
            </svg>
            Dodaj korisnika
          </button>
        </div>
      </div>

      {/* Search */}
      {!loading && !error && users.length > 0 && (
        <div className="users-search">
          <svg className="users-search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="9" r="6" />
            <path d="M14 14l4 4" />
          </svg>
          <input
            type="search"
            className="users-search-input"
            placeholder="Pretraži po imenu ili emailu…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Pretraživanje korisnika"
          />
          {searchQuery && (
            <button
              type="button"
              className="users-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Očisti pretraživanje"
            >
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.7 7.3a1 1 0 00-1.4 1.4L8.6 10l-1.3 1.3a1 1 0 101.4 1.4L10 11.4l1.3 1.3a1 1 0 001.4-1.4L11.4 10l1.3-1.3a1 1 0 00-1.4-1.4L10 8.6 8.7 7.3z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      )}

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
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Korisnik</th>
                <th>Email</th>
                <th>Uloga</th>
                <th>Registriran</th>
                <th className="users-th-actions">Akcije</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const isMe = user.id === currentUserId;
                return (
                  <tr key={user.id} className={isMe ? 'users-row-me' : ''}>
                    <td>
                      <div className="users-cell-user">
                        <div className="users-avatar" style={{ background: avatarColor(user.ime) }}>
                          {getInitials(user.ime)}
                        </div>
                        <span className="users-cell-name">
                          {user.ime}
                          {isMe && <span className="users-badge-me">Ti</span>}
                        </span>
                      </div>
                    </td>
                    <td className="users-cell-email">{user.email}</td>
                    <td>
                      {isMe ? (
                        <span className={`users-role-pill users-role-${user.role}`}>
                          {user.role === 'admin' ? 'Admin' : 'Korisnik'}
                        </span>
                      ) : (
                        <select
                          className="users-role-select"
                          value={user.role}
                          disabled={roleLoading === user.id}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        >
                          <option value="admin">Admin</option>
                          <option value="korisnik">Korisnik</option>
                        </select>
                      )}
                    </td>
                    <td className="users-cell-date" title={new Date(user.created_at).toLocaleString('hr-HR')}>
                      {relativeTime(user.created_at)}
                    </td>
                    <td>
                      {!isMe && (
                        <button
                          className="users-delete-btn"
                          title="Obriši korisnika"
                          onClick={() => setDeleteTarget(user)}
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <div className="modal-backdrop" onClick={() => setShowInvite(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Dodaj novog korisnika</h3>
              <button className="modal-close-btn" onClick={() => setShowInvite(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form className="modal-form" onSubmit={handleInvite}>
              {inviteError && <p className="modal-error">{inviteError}</p>}
              <div className="modal-field">
                <label className="modal-label">Ime</label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="Ivan Horvat"
                  value={inviteForm.ime}
                  onChange={(e) => setInviteForm((f) => ({ ...f, ime: e.target.value }))}
                  required
                  disabled={inviteLoading}
                />
              </div>
              <div className="modal-field">
                <label className="modal-label">Email</label>
                <input
                  className="modal-input"
                  type="email"
                  placeholder="ivan@primjer.hr"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  disabled={inviteLoading}
                />
              </div>
              <div className="modal-field">
                <label className="modal-label">Lozinka</label>
                <input
                  className="modal-input"
                  type="password"
                  placeholder="Najmanje 8 znakova"
                  value={inviteForm.password}
                  onChange={(e) => setInviteForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  minLength={8}
                  disabled={inviteLoading}
                />
              </div>
              <div className="modal-field">
                <label className="modal-label">Uloga</label>
                <select
                  className="modal-input"
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                  disabled={inviteLoading}
                >
                  <option value="korisnik">Korisnik</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn modal-btn-cancel"
                  onClick={() => setShowInvite(false)}
                  disabled={inviteLoading}
                >
                  Odustani
                </button>
                <button type="submit" className="modal-btn modal-btn-submit" disabled={inviteLoading}>
                  {inviteLoading ? 'Dodavanje...' : 'Dodaj korisnika'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Obriši korisnika"
        message={`Jeste li sigurni da želite obrisati korisnika "${deleteTarget?.ime}"? Ova radnja se ne može poništiti.`}
        confirmText="Obriši"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

export default UsersPage;

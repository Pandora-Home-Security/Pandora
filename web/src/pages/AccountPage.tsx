import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { getAuthToken, setAuthToken, clearAuthToken } from '../lib/auth';
import './AccountPage.css';

type AlertState = { type: 'success' | 'error'; message: string } | null;

function decodeToken(): { ime: string; email: string } | null {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { ime: payload.ime ?? '', email: payload.email ?? '' };
  } catch {
    return null;
  }
}

function AccountPage() {
  const navigate = useNavigate();
  const user = decodeToken();

  const [ime, setIme] = useState(user?.ime ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [profileAlert, setProfileAlert] = useState<AlertState>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [staraLozinka, setStaraLozinka] = useState('');
  const [novaLozinka, setNovaLozinka] = useState('');
  const [potvrda, setPotvrda] = useState('');
  const [passwordAlert, setPasswordAlert] = useState<AlertState>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        clearAuthToken();
        navigate('/login', { replace: true });
        return;
      }

      if (!res.ok) {
        setProfileAlert({ type: 'error', message: data.message ?? 'Greška pri ažuriranju profila.' });
        return;
      }

      if (data.token) {
        setAuthToken(data.token);
      }

      setProfileAlert({ type: 'success', message: data.message ?? 'Profil uspješno ažuriran.' });
    } catch {
      setProfileAlert({ type: 'error', message: 'Nije moguće spojiti se na server.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        clearAuthToken();
        navigate('/login', { replace: true });
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
    <div className="account-page">
      <div className="account-header">
        <div className="account-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div>
          <h1 className="account-title">Moj račun</h1>
          <p className="account-subtitle">Upravljajte svojim podacima i sigurnosnim postavkama</p>
        </div>
      </div>

      <div className="account-grid">
        {/* Kartica — osobni podaci */}
        <section className="account-card">
          <div className="card-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="card-icon">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <h2>Osobni podaci</h2>
          </div>

          <div className="card-current">
            <div className="current-field">
              <span className="current-label">Trenutno ime</span>
              <span className="current-value">{user?.ime || '—'}</span>
            </div>
            <div className="current-field">
              <span className="current-label">Trenutni email</span>
              <span className="current-value">{user?.email || '—'}</span>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="account-form" noValidate>
            <div className="form-field">
              <label htmlFor="ime">Novo ime</label>
              <input
                id="ime"
                type="text"
                value={ime}
                onChange={(e) => setIme(e.target.value)}
                placeholder="Unesite ime"
                autoComplete="name"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="email">Novi email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Unesite email adresu"
                autoComplete="email"
                required
              />
            </div>

            {profileAlert && (
              <div className={`account-alert account-alert-${profileAlert.type}`}>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  {profileAlert.type === 'success' ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  )}
                </svg>
                <span>{profileAlert.message}</span>
              </div>
            )}

            <button type="submit" className="account-btn" disabled={profileLoading}>
              {profileLoading ? (
                <>
                  <span className="btn-spinner" />
                  Spremanje...
                </>
              ) : (
                'Spremi promjene'
              )}
            </button>
          </form>
        </section>

        {/* Kartica — promjena lozinke */}
        <section className="account-card">
          <div className="card-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="card-icon">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <h2>Promjena lozinke</h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="account-form" noValidate>
            <div className="form-field">
              <label htmlFor="stara-lozinka">Stara lozinka</label>
              <input
                id="stara-lozinka"
                type="password"
                value={staraLozinka}
                onChange={(e) => setStaraLozinka(e.target.value)}
                placeholder="Unesite trenutnu lozinku"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="nova-lozinka">Nova lozinka</label>
              <input
                id="nova-lozinka"
                type="password"
                value={novaLozinka}
                onChange={(e) => setNovaLozinka(e.target.value)}
                placeholder="Najmanje 8 znakova"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="potvrda">Potvrda nove lozinke</label>
              <input
                id="potvrda"
                type="password"
                value={potvrda}
                onChange={(e) => setPotvrda(e.target.value)}
                placeholder="Ponovite novu lozinku"
                autoComplete="new-password"
                required
              />
            </div>

            {passwordAlert && (
              <div className={`account-alert account-alert-${passwordAlert.type}`}>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  {passwordAlert.type === 'success' ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  )}
                </svg>
                <span>{passwordAlert.message}</span>
              </div>
            )}

            <button type="submit" className="account-btn" disabled={passwordLoading}>
              {passwordLoading ? (
                <>
                  <span className="btn-spinner" />
                  Mijenjanje...
                </>
              ) : (
                'Promijeni lozinku'
              )}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default AccountPage;

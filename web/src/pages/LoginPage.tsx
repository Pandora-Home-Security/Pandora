import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './LoginPage.css';
import { apiFetch } from '../lib/api';
import { setAuthToken } from '../lib/auth';

function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const justRegistered = (location.state as { registered?: boolean } | null)?.registered === true;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Pogrešan email ili lozinka.');
        return;
      }
      setAuthToken(data.token);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Greška pri povezivanju sa serverom.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="grid-bg" aria-hidden="true">
        <div className="grid-lines"></div>
        <div className="grid-glow"></div>
      </div>

      <div className="particles" aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`}></div>
        ))}
      </div>

      <div className="login-scene">
        <div className="brand-panel">
          <div className="brand-content">
            <div className="brand-badge">
              <svg viewBox="0 0 48 48" fill="none" className="brand-shield">
                <path d="M24 4L6 14V24C6 35.1 13.68 45.48 24 48C34.32 45.48 42 35.1 42 24V14L24 4Z"
                      stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3"/>
                <path d="M24 8L10 16V24C10 33.05 16.36 41.38 24 43.86C31.64 41.38 38 33.05 38 24V16L24 8Z"
                      stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
                <path d="M20 30L15 25L13.18 26.82L20 33.64L35 18.64L33.18 16.82L20 30Z"
                      fill="currentColor" opacity="0.9"/>
              </svg>
            </div>
            <h1 className="brand-name">Pandora</h1>
            <div className="brand-divider"></div>
            <p className="brand-tagline">Sustav kućne sigurnosti</p>
            <div className="brand-features">
              <div className="feature-item">
                <span className="feature-dot"></span>
                <span>Nadzor u stvarnom vremenu</span>
              </div>
              <div className="feature-item">
                <span className="feature-dot"></span>
                <span>Detekcija pokreta i osoba</span>
              </div>
              <div className="feature-item">
                <span className="feature-dot"></span>
                <span>IoT upravljanje senzorima</span>
              </div>
            </div>
          </div>
          <p className="brand-copy">&copy; 2026 Pandora Security</p>
        </div>

        <div className="form-panel">
          <div className="form-card">
            <div className="form-header">
              <h2>Dobrodošli natrag</h2>
              <p>Prijavite se u svoj račun</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form" noValidate>
              {justRegistered && !error && (
                <div className="alert alert-success">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="alert-icon">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Račun uspješno stvoren. Možete se prijaviti.</span>
                </div>
              )}
              {error && (
                <div className="alert alert-error">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="alert-icon">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="field">
                <label htmlFor="email">Email adresa</label>
                <div className="input-box">
                  <input
                    id="email"
                    type="email"
                    placeholder="ime@primjer.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    autoComplete="email"
                    autoFocus
                  />
                  <svg viewBox="0 0 20 20" fill="currentColor" className="field-icon">
                    <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z"/>
                    <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z"/>
                  </svg>
                </div>
              </div>

              <div className="field">
                <label htmlFor="password">Lozinka</label>
                <div className="input-box">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Unesite lozinku"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.092 1.092a4 4 0 00-5.558-5.558z" clipRule="evenodd"/>
                        <path d="M10.748 13.93l2.523 2.523A9.987 9.987 0 0110 17a10.004 10.004 0 01-9.335-6.41 1.651 1.651 0 010-1.18A10.004 10.004 0 014.198 5.26l2.123 2.123A4 4 0 0010.748 13.93z"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>
                        <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="btn-loader"></span>
                ) : (
                  <>
                    <span>Prijavi se</span>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="btn-arrow">
                      <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="form-footer">
              <div className="footer-line"></div>
              <p>Nemate račun? <Link to="/register" className="link-register">Registrirajte se</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

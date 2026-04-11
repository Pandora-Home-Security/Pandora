import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

function DashboardPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <svg viewBox="0 0 48 48" fill="none" className="dashboard-shield">
            <path d="M24 4L6 14V24C6 35.1 13.68 45.48 24 48C34.32 45.48 42 35.1 42 24V14L24 4Z"
                  stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3"/>
            <path d="M24 8L10 16V24C10 33.05 16.36 41.38 24 43.86C31.64 41.38 38 33.05 38 24V16L24 8Z"
                  stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
            <path d="M20 30L15 25L13.18 26.82L20 33.64L35 18.64L33.18 16.82L20 30Z"
                  fill="currentColor" opacity="0.9"/>
          </svg>
          <h1>Pandora</h1>
        </div>
        <button type="button" className="logout-btn" onClick={handleLogout}>
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd"/>
            <path fillRule="evenodd" d="M19 10a.75.75 0 00-.22-.53l-3.25-3.25a.75.75 0 10-1.06 1.06l1.97 1.97H8.75a.75.75 0 000 1.5h7.69l-1.97 1.97a.75.75 0 101.06 1.06l3.25-3.25A.75.75 0 0019 10z" clipRule="evenodd"/>
          </svg>
          <span>Odjava</span>
        </button>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-welcome">
          <h2>Dobrodošli u Pandora kontrolnu ploču</h2>
          <p>Stvarni dashboard sadržaj (kamere, senzori, notifikacije, analitika) dolazi u sljedećem milestone-u <strong>M2 — Layout i navigacija</strong>.</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon">📹</div>
            <h3>Kamere</h3>
            <p>Pregled i upravljanje kamerama u realnom vremenu.</p>
          </div>
          <div className="dashboard-card">
            <div className="card-icon">📡</div>
            <h3>IoT senzori</h3>
            <p>Popis i statusi povezanih senzora.</p>
          </div>
          <div className="dashboard-card">
            <div className="card-icon">🚨</div>
            <h3>Notifikacije</h3>
            <p>Detektirani događaji i alarmi.</p>
          </div>
          <div className="dashboard-card">
            <div className="card-icon">📊</div>
            <h3>Analitika</h3>
            <p>Statistika aktivnosti i grafovi.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;

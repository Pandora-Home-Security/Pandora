import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CamerasPage from './pages/CamerasPage';
import CameraDetailPage from './pages/CameraDetailPage';
import AlarmsPage from './pages/AlarmsPage';
import PlaceholderPage from './pages/PlaceholderPage';
import AccountPage from './pages/AccountPage';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import ProtectedShell from './components/ProtectedShell';

function App() {
  return (
    <Routes>
      {/* Javne rute — dostupne samo neprijavljenim korisnicima */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Zaštićene rute — zahtijevaju prijavu, koriste zajednički layout i notifikacije */}
      <Route element={<ProtectedRoute />}>
        <Route element={<ProtectedShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/kamere" element={<CamerasPage />} />
          <Route path="/kamere/:id" element={<CameraDetailPage />} />
          <Route path="/senzori" element={<PlaceholderPage title="IoT senzori" icon="📡" />} />
          <Route path="/alarmi" element={<AlarmsPage />} />
          <Route path="/analitika" element={<PlaceholderPage title="Analitika" icon="📊" />} />
          <Route path="/korisnici" element={<PlaceholderPage title="Upravljanje korisnicima" icon="👥" />} />
          <Route path="/racun" element={<AccountPage />} />
        </Route>
      </Route>

      {/* Fallback — sve nepoznate rute vode na /login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;

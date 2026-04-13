import { Navigate, Outlet } from 'react-router-dom';
import { getAuthToken } from '../lib/auth';

/**
 * Javna ruta: dostupna samo neprijavljenim korisnicima.
 * Ako je korisnik vec prijavljen (token u localStorage), preusmjerava na /dashboard.
 * Koristi se za /login i /register stranice.
 */
function PublicRoute() {
  const isAuthenticated = getAuthToken() !== null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

export default PublicRoute;

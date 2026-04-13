import { Navigate, Outlet } from 'react-router-dom';
import { getAuthToken } from '../lib/auth';

/**
 * Zasticena ruta: dopusta pristup samo prijavljenim korisnicima.
 * Ako token ne postoji u localStorage, preusmjerava na /login.
 */
function ProtectedRoute() {
  const isAuthenticated = getAuthToken() !== null;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;

import { Navigate, Outlet } from 'react-router-dom';

/**
 * Zaštićena ruta: dopušta pristup samo prijavljenim korisnicima.
 * Ako token ne postoji u localStorage, preusmjerava na /login.
 */
function ProtectedRoute() {
  const isAuthenticated = localStorage.getItem('token') !== null;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;

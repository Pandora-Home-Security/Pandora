import { Navigate, Outlet } from 'react-router-dom';

/**
 * Javna ruta: dostupna samo neprijavljenim korisnicima.
 * Ako je korisnik već prijavljen (token u localStorage), preusmjerava na /dashboard.
 * Koristi se za /login i /register stranice.
 */
function PublicRoute() {
  const isAuthenticated = localStorage.getItem('token') !== null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

export default PublicRoute;

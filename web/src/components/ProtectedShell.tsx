import { NotificationsProvider } from '../contexts/NotificationsContext';
import AppLayout from './AppLayout';
import ToastContainer from './ToastContainer';

/**
 * Omotava AppLayout s providerom za real-time notifikacije.
 * Polling i toast notifikacije rade samo za prijavljene korisnike
 * jer se ova komponenta renderira samo unutar ProtectedRoute.
 */
function ProtectedShell() {
  return (
    <NotificationsProvider>
      <AppLayout />
      <ToastContainer />
    </NotificationsProvider>
  );
}

export default ProtectedShell;

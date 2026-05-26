import { AppScreenLayout } from '../../components/AppScreenLayout';
import { PlaceholderScreen } from '../../components/PlaceholderScreen';

export const AnalyticsScreen = () => (
  <AppScreenLayout title="Analitika">
    <PlaceholderScreen
      title="Analitika"
      description="Grafovi, filteri i statistike sustava."
      milestone="M7"
    />
  </AppScreenLayout>
);

export const UsersScreen = () => (
  <AppScreenLayout title="Korisnici">
    <PlaceholderScreen
      title="Korisnici"
      description="Admin panel za upravljanje korisnicima i njihovim ulogama."
      milestone="M6"
    />
  </AppScreenLayout>
);

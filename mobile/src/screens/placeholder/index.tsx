import { AppScreenLayout } from '../../components/AppScreenLayout';
import { PlaceholderScreen } from '../../components/PlaceholderScreen';

export const UsersScreen = () => (
  <AppScreenLayout title="Korisnici">
    <PlaceholderScreen
      title="Korisnici"
      description="Admin panel za upravljanje korisnicima i njihovim ulogama."
      milestone="M6"
    />
  </AppScreenLayout>
);

import { AppScreenLayout } from '../../components/AppScreenLayout';
import { PlaceholderScreen } from '../../components/PlaceholderScreen';

export const SensorsScreen = () => (
  <AppScreenLayout title="Senzori">
    <PlaceholderScreen
      title="Senzori"
      description="Pregled IoT senzora, podataka u stvarnom vremenu i upravljanje."
      milestone="M5"
    />
  </AppScreenLayout>
);

export const AlarmsScreen = () => (
  <AppScreenLayout title="Alarmi">
    <PlaceholderScreen
      title="Alarmi"
      description="Popis alarma, oznacavanje kao procitano i real-time push notifikacije."
      milestone="M4"
    />
  </AppScreenLayout>
);

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

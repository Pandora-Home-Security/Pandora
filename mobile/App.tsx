import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStack } from './src/navigation/RootStack';
import { NotificationsProvider } from './src/contexts/NotificationsContext';
import { ToastContainer } from './src/components/ToastContainer';
import { colors } from './src/theme/colors';

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bgDeep,
    card: colors.bgSurface,
    text: colors.textPrimary,
    primary: colors.accent,
    border: colors.borderSubtle,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <NotificationsProvider>
          <View style={{ flex: 1 }}>
            <RootStack />
            <ToastContainer />
          </View>
          <StatusBar style="light" />
        </NotificationsProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

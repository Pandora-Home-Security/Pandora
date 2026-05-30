import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStack } from './src/navigation/RootStack';
import { NotificationsProvider } from './src/contexts/NotificationsContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { ToastContainer } from './src/components/ToastContainer';

function ThemedApp() {
  const { theme, colors } = useTheme();
  const baseNav = theme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...baseNav,
    colors: {
      ...baseNav.colors,
      background: colors.bgDeep,
      card: colors.bgSurface,
      text: colors.textPrimary,
      primary: colors.accent,
      border: colors.borderSubtle,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <NotificationsProvider>
        <View style={{ flex: 1 }}>
          <RootStack />
          <ToastContainer />
        </View>
        <StatusBar style={colors.statusBar} />
      </NotificationsProvider>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

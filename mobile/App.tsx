import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthStack } from './src/navigation/AuthStack';
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
        <AuthStack />
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { CamerasScreen } from '../screens/CamerasScreen';
import { CameraDetailScreen } from '../screens/CameraDetailScreen';
import {
  SensorsScreen,
  AlarmsScreen,
  AnalyticsScreen,
  UsersScreen,
} from '../screens/placeholder';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  Login: { justRegistered?: boolean } | undefined;
  Register: undefined;
  Dashboard: undefined;
  Cameras: undefined;
  CameraDetail: { id: string };
  Sensors: undefined;
  Alarms: undefined;
  Analytics: undefined;
  Users: undefined;
  Account: undefined;
};

export type RootStackNavigation = NativeStackNavigationProp<RootStackParamList>;

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgDeep },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Cameras" component={CamerasScreen} />
      <Stack.Screen name="CameraDetail" component={CameraDetailScreen} />
      <Stack.Screen name="Sensors" component={SensorsScreen} />
      <Stack.Screen name="Alarms" component={AlarmsScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Users" component={UsersScreen} />
      <Stack.Screen name="Account" component={AccountScreen} />
    </Stack.Navigator>
  );
}

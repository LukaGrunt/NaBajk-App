import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { FavouritesProvider } from '@/contexts/FavouritesContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import { PushPermissionGate } from '@/components/auth/PushPermissionGate';

export {
  ErrorBoundary,
} from 'expo-router';

// Custom dark theme using NaBajk colors
const NaBajkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.brandGreen,
    background: Colors.background,
    card: Colors.cardSurface,
    text: Colors.textPrimary,
    border: Colors.border,
  },
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <LanguageProvider>
        <UserProfileProvider>
          <FavouritesProvider>
            <ThemeProvider value={NaBajkTheme}>
              <PushPermissionGate>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="auth-welcome" />
                  <Stack.Screen name="auth/callback" />
                  <Stack.Screen name="welcome" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen
                    name="route/[id]"
                    options={{
                      headerShown: true,
                      headerTitle: '',
                      headerTransparent: true,
                      headerTintColor: '#FFFFFF',
                    }}
                  />
                  <Stack.Screen
                    name="routes/category/[category]"
                    options={{
                      headerShown: true,
                      headerTitle: '',
                      headerTransparent: false,
                      headerTintColor: Colors.textPrimary,
                      headerStyle: { backgroundColor: Colors.background },
                    }}
                  />
                  <Stack.Screen
                    name="group-rides/create"
                    options={{
                      headerShown: true,
                      headerTitle: '',
                      headerTransparent: false,
                      headerTintColor: Colors.textPrimary,
                      headerStyle: { backgroundColor: Colors.background },
                    }}
                  />
                  <Stack.Screen name="recording"         options={{ headerShown: true }} />
                  <Stack.Screen name="ride-summary"     options={{ headerShown: true }} />
                  <Stack.Screen name="saved-rides"      options={{ headerShown: true }} />
                  <Stack.Screen name="saved-rides/[id]" options={{ headerShown: true }} />
                  <Stack.Screen
                    name="group-rides/[id]"
                    options={{
                      headerShown: true,
                      headerTitle: '',
                      headerTransparent: true,
                      headerTintColor: '#FFFFFF',
                    }}
                  />
                </Stack>
              </PushPermissionGate>
            </ThemeProvider>
          </FavouritesProvider>
        </UserProfileProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

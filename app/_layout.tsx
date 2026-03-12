import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../context/AuthContext';

const UbarTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1A1A1A',
    border: '#E8E8E8',
    primary: '#000000',
  },
};

export const unstable_settings = {
  initialRouteName: 'login',
};

function InitialLayout() {
  const { session, initialized } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';

    if (session && inAuthGroup) {
      // Redirect to home if logged in and trying to access login/signup
      router.replace('/(tabs)');
    } else if (!session && !inAuthGroup) {
      // Redirect to login if not logged in and not on an auth screen
      // (This prevents them from getting stuck in tabs when not authenticated)
      router.replace('/login');
    }
  }, [session, initialized, segments]);

  if (!initialized) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <Stack>
      {/* Auth screens */}
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />

      {/* Main app tabs */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Plan ride screen */}
      <Stack.Screen
        name="plan-ride"
        options={{ headerShown: false, animation: 'slide_from_bottom' }}
      />

      {/* Choose ride screen */}
      <Stack.Screen
        name="choose-ride"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider value={UbarTheme}>
          <InitialLayout />
          <StatusBar style="dark" />
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

import { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useUserStore } from '../store/useUserStore';

export default function RootLayout() {
  const { isAuthenticated } = useUserStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  // Redirection conditionnelle basée sur l'état d'authentification
  useEffect(() => {
    // Évite les erreurs de redirection initiale avant que rootLayout soit monté
    if (!navigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    setTimeout(() => {
      if (!isAuthenticated && !inAuthGroup) {
        // Redirige vers l'écran de lancement (auth/index) si non connecté
        router.replace('/(auth)');
      } else if (isAuthenticated && inAuthGroup) {
        // Redirige vers l'accueil (tabs) si connecté
        router.replace('/(tabs)');
      }
    }, 1);
  }, [isAuthenticated, segments, navigationState?.key]);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}

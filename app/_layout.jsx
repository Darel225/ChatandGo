import { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useUserStore } from '../store/useUserStore';
import ErrorBoundary from '../components/ErrorBoundary';

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
    const inTabsGroup = segments[0] === '(tabs)';
    
    // Ajout d'un léger délai pour garantir qu'Expo Router a terminé son cycle de rendu
    setTimeout(() => {
      if (!isAuthenticated && !inAuthGroup) {
        // Redirige vers l'écran de lancement (auth/index) si non connecté
        router.replace('/(auth)');
      } else if (isAuthenticated && !inTabsGroup) {
        // Redirige vers l'accueil (tabs) si connecté et sur une autre route (auth ou /)
        router.replace('/(tabs)');
      }
    }, 1);
  }, [isAuthenticated, segments, navigationState?.key]);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

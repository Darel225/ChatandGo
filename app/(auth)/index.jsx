import React, { useEffect, useRef } from 'react';
import { Image, View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import ScreenWrapper from '../../components/layout/ScreenWrapper';


const DURATION = 2500; // durée totale en ms

export default function LaunchScreen() {
  const router = useRouter();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Lance l'animation de la barre de progression
    Animated.timing(progress, {
      toValue: 1,
      duration: DURATION,
      useNativeDriver: false, // false car on anime une largeur (layout)
    }).start();

    // Navigue vers l'onboarding à la fin du chargement
    const timer = setTimeout(() => {
      router.push('/(auth)/onboarding');
    }, DURATION);

    return () => clearTimeout(timer);
  }, []);

  // Interpolation : de 0% à 100% de la largeur du conteneur
  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <ScreenWrapper style={styles.container}>
      {/* Logo et nom de l'application */}
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>C&G</Text>
        </View>
        <Text style={styles.appName}>Chat&Go</Text>
        <Text style={styles.slogan}>COMMERCE FLUIDITÉ</Text>
      </View>

      {/* Barre de progression animée */}
      <View style={styles.loaderContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: barWidth }]} />
        </View>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: Colors.primary,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    // Ombre subtile
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 6,
  },
  slogan: {
    fontSize: 12,
    color: Colors.textLight,
    letterSpacing: 3,
  },
  loaderContainer: {
    width: '70%',
    alignItems: 'center',
    paddingBottom: 20,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.gray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textLight,
    fontSize: 12,
    letterSpacing: 1,
  },
});

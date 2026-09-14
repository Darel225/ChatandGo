import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import CustomButton from '../../components/ui/CustomButton';
import { authService } from '../../services/authService';

// Couleur primaire du bouton e-mail (hérite de Colors.primary)

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);

  // Validation simple : l'adresse doit contenir "@" et au moins un "."
  const isValid = email.includes('@') && email.includes('.');

  const handleContinue = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await authService.requestOtp(email.trim().toLowerCase());
      // Transmet l'e-mail en paramètre de navigation vers l'écran de vérification
      router.push({ pathname: '/(auth)/verify-otp', params: { email: email.trim().toLowerCase() } });
    } catch (error) {
      if (__DEV__) { console.error(error); }
      Alert.alert('Erreur', error.message || "Impossible d'envoyer le code. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* â”€â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="chatbubble-ellipses" size={36} color="#fff" />
          </View>
          <Text style={styles.appName}>Chat<Text style={styles.appNameAccent}>&</Text>Go</Text>
          <Text style={styles.tagline}>COMMERCE · FLUIDITÉ</Text>
        </View>

        {/* â”€â”€â”€ Carte formulaire â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <View style={styles.card}>
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>
            Entrez votre adresse e-mail pour recevoir votre code de vérification.
          </Text>

          {/* Champ de saisie de l'e-mail */}
          <TouchableOpacity
            style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
          >
            {/* Icône e-mail */}
            <Ionicons
              name="mail-outline"
              size={20}
              color={isFocused ? Colors.primary : Colors.textLight}
              style={styles.emailIcon}
            />

            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="nom@exemple.com"
              placeholderTextColor={Colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />

            {/* Icône de validation si l'e-mail est valide */}
            {isValid && (
              <Ionicons name="checkmark-circle" size={22} color={Colors.success} style={styles.checkIcon} />
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>
            <Ionicons name="lock-closed-outline" size={11} /> Vos données sont sécurisées et ne seront jamais partagées.
          </Text>

          {/* Bouton Continuer */}
          <CustomButton
            title="Continuer"
            onPress={handleContinue}
            loading={loading}
            style={[styles.continueBtn, !isValid && styles.continueBtnDisabled]}
          />
        </View>

        {/* â”€â”€â”€ Conditions d'utilisation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Text style={[styles.terms, { paddingBottom: insets.bottom + 24 }]}>
          En continuant, vous acceptez nos{' '}
          <Text style={styles.termsLink}>Conditions d'utilisation</Text>
          {' '}et notre{' '}
          <Text style={styles.termsLink}>Politique de confidentialité</Text>.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scroll: {
    flexGrow: 1,
  },

  // â”€â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 36,
  },
  iconContainer: {
    width: 68,
    height: 68,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  appNameAccent: {
    color: 'rgba(255,255,255,0.7)',
  },
  tagline: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 3,
    marginTop: 4,
  },

  // â”€â”€â”€ Carte formulaire â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  card: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 8,
    // Ombre douce vers le haut
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 21,
    marginBottom: 28,
  },

  // â”€â”€â”€ Champ de saisie e-mail â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.gray,
    height: 58,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  inputWrapperFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#fff',
    // Halo de focus
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  emailIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  checkIcon: {
    marginLeft: 6,
  },
  hint: {
    fontSize: 11,
    color: Colors.textLight,
    marginBottom: 24,
    lineHeight: 17,
  },

  // â”€â”€â”€ Bouton principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  continueBtn: {
    marginBottom: 24,
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },

  // â”€â”€â”€ CGU â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  terms: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textLight,
    paddingHorizontal: 30,
    paddingTop: 16,
    lineHeight: 18,
    backgroundColor: Colors.background,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '500',
  },
});


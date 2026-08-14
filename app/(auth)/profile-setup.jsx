import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import CustomButton from '../../components/ui/CustomButton';
import { useUserStore } from '../../store/useUserStore';
import { authService } from '../../services/authService';

export default function ProfileSetupScreen() {
  const [fullName, setFullName] = useState('');
  const [zone, setZone] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [nameFocused, setNameFocused] = useState(false);
  const [zoneFocused, setZoneFocused] = useState(false);
  // État de chargement pendant l'appel API vers n8n
  const [loading, setLoading] = useState(false);

  const { setUserData, login } = useUserStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // email est passé en paramètre depuis verify-otp.jsx
  const { email } = useLocalSearchParams();

  const isValid = fullName.trim().length >= 2 && zone.trim().length >= 2;

  // ─── Sélecteur de photo (galerie uniquement) ──────────────
  const handlePickAvatar = async () => {
    // Demande la permission d'accès à la galerie photos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission refusée',
        "Autorisez l'accès à la galerie dans les paramètres de votre téléphone pour choisir une photo.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,   // crop carré natif
      aspect: [1, 1],        // ratio 1:1 pour avatar rond
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleComplete = async () => {
    if (!isValid || loading) return;
    setLoading(true);

    // ── Règle de séparation nom / prénom ──────────────────────
    // S'il n'y a qu'un seul mot : ce mot va dans 'nom', 'prenom' est vide.
    // S'il y a plusieurs mots : le premier est 'prenom', le reste est 'nom'.
    const parts = fullName.trim().split(/\s+/);
    const prenom = parts.length > 1 ? parts[0] : '';
    const nom = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];

    try {
      // Appel au webhook n8n de mise à jour du profil
      const result = await authService.updateProfile({
        email: email || '',
        nom,
        prenom,
        quartier: zone.trim(),
        photo_url: avatar || '',   // chaîne vide si aucune photo choisie
      });

      if (result.success) {
        // Mise à jour du store Zustand avec les données renvoyées par le serveur
        const serverUser = result.user || {};
        setUserData({
          userId: serverUser.id || null,
          firstName: prenom || nom,    // priorité au prénom, sinon le nom seul
          nom: serverUser.nom || nom,
          prenom: serverUser.prenom || prenom,
          email: serverUser.email || email || null,
          avatar,
          zone: zone.trim(),
          quartier: serverUser.quartier || zone.trim(),
          ville: serverUser.ville || null,
        });
        login();
        // Redirige vers l'application principale en effaçant le stack d'auth
        // router.replace empêche de revenir en arrière vers les écrans d'auth
        router.replace('/(tabs)');
      } else {
        Alert.alert(
          'Erreur',
          result.message || 'La mise à jour du profil a échoué. Veuillez réessayer.',
        );
      }
    } catch (error) {
      console.error('[ProfileSetup.handleComplete]', error);
      Alert.alert('Erreur réseau', error.message || 'Impossible de sauvegarder votre profil. Réessayez.');
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
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ─── En-tête ──────────────────────────────────── */}
        <View style={styles.headerBlock}>
          <View style={styles.stepRow}>
            <View style={styles.stepDot} />
            <View style={styles.stepDot} />
            <View style={[styles.stepDot, styles.stepDotActive]} />
          </View>
          <Text style={styles.title}>Mon profil</Text>
          <Text style={styles.subtitle}>
            Dernière étape ! Personnalisez votre compte pour une expérience optimale.
          </Text>
        </View>

        {/* ─── Avatar ───────────────────────────────────── */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickAvatar} activeOpacity={0.85}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person-outline" size={44} color={Colors.textLight} />
              </View>
            )}
            {/* Bouton caméra flottant */}
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Appuyez pour choisir une photo</Text>
        </View>

        {/* ─── Formulaire ───────────────────────────────── */}
        <View style={styles.form}>
          {/* Nom complet */}
          <Text style={styles.label}>Nom complet</Text>
          <View style={[styles.inputWrapper, nameFocused && styles.inputFocused]}>
            <Ionicons
              name="person-outline"
              size={20}
              color={nameFocused ? Colors.primary : Colors.textLight}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Entrez votre nom complet"
              placeholderTextColor={Colors.textLight}
              value={fullName}
              onChangeText={setFullName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              autoCapitalize="words"
              returnKeyType="next"
            />
            {fullName.trim().length >= 2 && (
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            )}
          </View>

          {/* Zone géographique */}
          <Text style={[styles.label, { marginTop: 20 }]}>Quartier / Commune</Text>
          <View style={[styles.inputWrapper, zoneFocused && styles.inputFocused]}>
            <Ionicons
              name="location-outline"
              size={20}
              color={zoneFocused ? Colors.primary : Colors.textLight}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Ex : Cocody, Yopougon, Plateau…"
              placeholderTextColor={Colors.textLight}
              value={zone}
              onChangeText={setZone}
              onFocus={() => setZoneFocused(true)}
              onBlur={() => setZoneFocused(false)}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleComplete}
            />
            {zone.trim().length >= 2 && (
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            )}
          </View>

          {/* Info zone */}
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={13} color={Colors.textLight} />
            <Text style={styles.infoText}>
              Votre zone nous aide à vous proposer les prestataires les plus proches.
            </Text>
          </View>
        </View>

        {/* ─── Pied de page ─────────────────────────────── */}
        <View style={styles.footer}>
          <CustomButton
            title="Commencer l'aventure →"
            onPress={handleComplete}
            loading={loading}
            style={[styles.cta, (!isValid || loading) && styles.ctaDisabled]}
          />
          <View style={styles.securityRow}>
            <Ionicons name="lock-closed-outline" size={13} color={Colors.textLight} />
            <Text style={styles.securityText}>Vos données sont sécurisées et chiffrées.</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },

  // ─── En-tête ──────────────────────────────────────────────
  headerBlock: {
    paddingTop: 24,
    marginBottom: 32,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
  },
  stepDot: {
    width: 28,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    width: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 21,
  },

  // ─── Avatar ───────────────────────────────────────────────
  avatarSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: Colors.background,
    // Ombre
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarHint: {
    fontSize: 12,
    color: Colors.textLight,
  },

  // ─── Formulaire ───────────────────────────────────────────
  form: {
    marginBottom: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.gray,
    height: 56,
    paddingHorizontal: 14,
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#fff',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textLight,
    lineHeight: 17,
  },

  // ─── Pied de page ─────────────────────────────────────────
  footer: {},
  cta: {
    marginBottom: 16,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  securityText: {
    fontSize: 11,
    color: Colors.textLight,
  },
});

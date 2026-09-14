import React, { useState, useRef } from 'react';
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
  const [loading, setLoading] = useState(false);

  // Référence pour le passage au champ suivant
  const zoneInputRef = useRef(null);

  const { setUserData, login } = useUserStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const isValid = fullName.trim().length >= 2 && zone.trim().length >= 2;

  const handlePickAvatar = async () => {
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
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleComplete = async () => {
    if (!isValid || loading) return;
    setLoading(true);

    const parts = fullName.trim().split(/\s+/);
    const prenom = parts.length > 1 ? parts[0] : '';
    const nom = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];

    try {
      const result = await authService.updateProfile({
        email: email || '',
        nom,
        prenom,
        quartier: zone.trim(),
        photo_url: avatar || '',
      });

      if (result.success) {
        const serverUser = result.user || {};
        setUserData({
          userId: serverUser.id || null,
          firstName: prenom || nom,
          nom: serverUser.nom || nom,
          prenom: serverUser.prenom || prenom,
          email: serverUser.email || email || null,
          avatar,
          zone: zone.trim(),
          quartier: serverUser.quartier || zone.trim(),
          ville: serverUser.ville || null,
        });
        login();
        router.replace('/(tabs)');
      } else {
        Alert.alert(
          'Erreur',
          result.message || 'La mise à jour du profil a échoué. Veuillez réessayer.',
        );
      }
    } catch (error) {
      if (__DEV__) { console.error('[ProfileSetup.handleComplete]', error); }
      Alert.alert('Erreur réseau', error.message || 'Impossible de sauvegarder votre profil. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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

        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickAvatar} activeOpacity={0.85}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person-outline" size={44} color={Colors.textLight} />
              </View>
            )}
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Appuyez pour choisir une photo</Text>
        </View>

        <View style={styles.form}>
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
              onSubmitEditing={() => zoneInputRef.current?.focus()}
              blurOnSubmit={false}
            />
            {fullName.trim().length >= 2 && (
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            )}
          </View>

          <Text style={[styles.label, { marginTop: 20 }]}>Quartier / Commune</Text>
          <View style={[styles.inputWrapper, zoneFocused && styles.inputFocused]}>
            <Ionicons
              name="location-outline"
              size={20}
              color={zoneFocused ? Colors.primary : Colors.textLight}
              style={styles.inputIcon}
            />
            <TextInput
              ref={zoneInputRef}
              style={styles.input}
              placeholder="Ex : Cocody, Yopougon, Plateau"
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

          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={13} color={Colors.textLight} />
            <Text style={styles.infoText}>
              Votre zone nous aide à vous proposer les prestataires les plus proches.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <CustomButton
            title="Commencer l'aventure"
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
    // SUPPRESSION DE "elevation: 3" ICI POUR FIXER LE BUG ANDROID
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

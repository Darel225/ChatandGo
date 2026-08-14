import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { authService } from '../../services/authService';
import { useUserStore } from '../../store/useUserStore';

const { width } = Dimensions.get('window');
const CODE_LENGTH = 4;
const BOX_SIZE = (width - 48 - (CODE_LENGTH - 1) * 12) / CODE_LENGTH;

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'delete'],
];

export default function VerifyOtpScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [countdown, setCountdown] = useState(59);
  const router = useRouter();
  // Récupère l'adresse e-mail transmise depuis l'écran de connexion
  const { email } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  // Récupère setUserData et login depuis le store global
  const { setUserData, login } = useUserStore();

  // Animation shake sur erreur
  const shakeAnim = useRef(new Animated.Value(0)).current;
  // Animation scale sur chaque touche
  const keyScales = useRef(
    KEYS.flat().reduce((acc, k) => ({ ...acc, [k]: new Animated.Value(1) }), {})
  ).current;

  // Compte à rebours "renvoyer"
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, []);

  const triggerShake = () => {
    Vibration.vibrate(200);
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const animateKey = (key) => {
    if (!keyScales[key]) return;
    Animated.sequence([
      Animated.spring(keyScales[key], { toValue: 0.85, useNativeDriver: true, speed: 50 }),
      Animated.spring(keyScales[key], { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
  };

  const handleKeyPress = (key) => {
    if (!key) return;
    animateKey(key);
    setError(false);
    if (key === 'delete') {
      setCode(prev => prev.slice(0, -1));
    } else if (code.length < CODE_LENGTH) {
      setCode(prev => prev + key);
    }
  };

  const handleVerify = async () => {
    if (code.length !== CODE_LENGTH) return;
    setLoading(true);
    try {
      // Appel vers le webhook n8n de vérification du code OTP
      const result = await authService.verifyOtp(email, code);

      if (result.isValid) {
        if (result.isNewUser) {
          // Nouvel utilisateur : redirige vers l'écran de configuration du profil
          router.push({ pathname: '/(auth)/profile-setup', params: { email } });
        } else {
          // Utilisateur existant : sauvegarde ses données et accède directement à l'app
          const user = result.user || {};
          setUserData({
            userId: user.id || null,
            nom: user.nom || null,
            prenom: user.prenom || null,
            firstName: user.prenom || null,   // alias pour l'UI
            email: user.email || email,       // adresse e-mail de l'utilisateur
            ville: user.ville_par_defaut || null,
            quartier: user.quartier_par_defaut || null,
            zone: user.quartier_par_defaut || null,
          });
          login();
          // Remplace le stack d'auth par l'application principale
          router.replace('/(tabs)');
        }
      } else {
        // Code incorrect : animation shake + réinitialisation
        setError(true);
        setCode('');
        triggerShake();
      }
    } catch (e) {
      console.error('[VerifyOtpScreen]', e);
      Alert.alert('Erreur', e.message || 'La vérification a échoué. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  // Valide automatiquement quand les 5 chiffres sont saisis
  useEffect(() => {
    if (code.length === CODE_LENGTH) handleVerify();
  }, [code]);

  const handleResend = () => {
    if (countdown > 0) return;
    setCountdown(59);
    setCode('');
    setError(false);
    // Renvoie un nouveau code OTP vers l'adresse e-mail via le webhook n8n
    authService.requestOtp(email).catch(console.error);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* ─── En-tête ────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* ─── Contenu principal ──────────────────────── */}
      <View style={styles.content}>
        {/* Icône décorative */}
        <View style={styles.iconBadge}>
          <Ionicons name="shield-checkmark" size={32} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Vérification</Text>
        <Text style={styles.subtitle}>
          Code envoyé à l'adresse{'\n'}
          <Text style={styles.phoneHighlight}>{email || 'votre@email.com'}</Text>
        </Text>

        {/* ─── Cases OTP ────────────────────────────── */}
        <Animated.View
          style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}
        >
          {Array.from({ length: CODE_LENGTH }).map((_, i) => {
            const filled = i < code.length;
            const active = i === code.length;
            return (
              <View
                key={i}
                style={[
                  styles.otpBox,
                  active && styles.otpBoxActive,
                  filled && styles.otpBoxFilled,
                  error && styles.otpBoxError,
                ]}
              >
                {filled ? (
                  <View style={styles.otpDot} />
                ) : (
                  <Text style={styles.otpPlaceholder}>—</Text>
                )}
              </View>
            );
          })}
        </Animated.View>

        {/* Message d'erreur */}
        {error && (
          <Text style={styles.errorText}>
            <Ionicons name="close-circle-outline" size={13} /> Code incorrect. Réessayez.
          </Text>
        )}

        {/* Renvoyer le code */}
        <TouchableOpacity onPress={handleResend} disabled={countdown > 0} style={styles.resendRow}>
          <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
            Renvoyer le code
          </Text>
          {countdown > 0 && (
            <Text style={styles.countdown}> ({countdown}s)</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ─── Clavier numérique ──────────────────────── */}
      <View style={styles.keypad}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.keyRow}>
            {row.map((key, ki) => (
              <Animated.View
                key={ki}
                style={[
                  styles.keyWrap,
                  key && { transform: [{ scale: keyScales[key] ?? 1 }] },
                ]}
              >
                <TouchableOpacity
                  style={[styles.key, !key && styles.keyEmpty]}
                  onPress={() => handleKeyPress(key)}
                  disabled={!key || loading}
                  activeOpacity={0.85}
                >
                  {key === 'delete' ? (
                    <Ionicons name="backspace-outline" size={26} color={Colors.text} />
                  ) : (
                    <Text style={styles.keyText}>{key}</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        ))}

        {/* Indicateur de chargement sous le clavier */}
        {loading && (
          <View style={styles.loadingRow}>
            <Text style={styles.loadingText}>Vérification en cours…</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ─── Top bar ──────────────────────────────────────────────
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Contenu ──────────────────────────────────────────────
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: 'center',
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  phoneHighlight: {
    color: Colors.text,
    fontWeight: '700',
  },

  // ─── Cases OTP ────────────────────────────────────────────
  otpRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  otpBox: {
    width: BOX_SIZE,
    height: BOX_SIZE * 1.15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: '#fff',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}12`,
  },
  otpBoxError: {
    borderColor: Colors.error,
    backgroundColor: `${Colors.error}10`,
  },
  otpDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
  },
  otpPlaceholder: {
    fontSize: 18,
    color: Colors.border,
    fontWeight: '300',
  },

  // ─── Erreur ───────────────────────────────────────────────
  errorText: {
    color: Colors.error,
    fontSize: 13,
    marginBottom: 12,
  },

  // ─── Renvoyer ─────────────────────────────────────────────
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  resendText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  resendDisabled: {
    color: Colors.textLight,
  },
  countdown: {
    color: Colors.textLight,
    fontSize: 14,
  },

  // ─── Clavier ──────────────────────────────────────────────
  keypad: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  keyWrap: {
    flex: 1,
    alignItems: 'center',
  },
  key: {
    width: 76,
    height: 64,
    borderRadius: 18,
    backgroundColor: Colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
    // Ombre subtile pour un effet "touche de téléphone"
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  keyEmpty: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  keyText: {
    fontSize: 26,
    fontWeight: '500',
    color: Colors.text,
  },

  // ─── Chargement ───────────────────────────────────────────
  loadingRow: {
    alignItems: 'center',
    paddingTop: 4,
  },
  loadingText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
});

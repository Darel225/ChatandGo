import React, { useRef, useState } from 'react';
import { BASE_URL } from '../../constants/api';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Animated,
  Switch,
  Modal,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useUserStore } from '../../store/useUserStore';

// ─── Composant ligne de menu avec animation de press ─────────────────────────
const MenuItem = ({ icon, iconColor = Colors.primary, iconBg = '#EBF3FF', label, value, onPress, danger = false, chevron = true, rightNode }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={styles.menuItem}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        activeOpacity={1}
      >
        {/* Icône colorée */}
        <View style={[styles.menuIconWrap, { backgroundColor: danger ? '#FFEBEB' : iconBg }]}>
          <Ionicons name={icon} size={20} color={danger ? Colors.error : iconColor} />
        </View>

        {/* Texte */}
        <View style={styles.menuBody}>
          {value ? (
            <>
              <Text style={styles.menuLabel}>{label}</Text>
              <Text style={styles.menuValue}>{value}</Text>
            </>
          ) : (
            <Text style={[styles.menuSingleText, danger && { color: Colors.error }]}>{label}</Text>
          )}
        </View>

        {/* Noeud droit : chevron ou composant custom (Switch, badge...) */}
        {rightNode ? rightNode : chevron && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={danger ? Colors.error : Colors.border}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Séparateur ───────────────────────────────────────────────────────────────
const Divider = () => <View style={styles.divider} />;

// ─── Modal réutilisable ───────────────────────────────────────────────────────
const AppModal = ({ visible, title, onClose, children }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={22} color={Colors.textLight} />
          </TouchableOpacity>
        </View>
        {children}
      </View>
    </View>
  </Modal>
);

// ─── Écran ────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { firstName, avatar, zone, email, logout } = useUserStore();

  // ── États ─────────────────────────────────────────────
  const [notifPush, setNotifPush]             = useState(true);
  const [notifEmail, setNotifEmail]           = useState(false);
  const [showPrivacy, setShowPrivacy]         = useState(false);
  const [showAppSettings, setShowAppSettings] = useState(false);
  // Indique qu'un appel de suppression est en cours (désactive le bouton)
  const [clearing, setClearing]               = useState(false);

  // ── Déconnexion ────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Es-tu sûr de vouloir te déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se déconnecter', style: 'destructive', onPress: logout },
      ],
    );
  };

  // ── Vider l'historique ───────────────────────────────────
  const clearHistory = () => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer tout votre historique de conversation ?\nCette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            try {
              const response = await fetch(
                `${BASE_URL}/history/clear-history`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email }),
                }
              );

              // Lecture sécurisée pour éviter "Unexpected end of input"
              const text = await response.text();
              const data = text ? JSON.parse(text) : {};

              if (response.ok && data.success !== false) {
                // Ferme la modale des paramètres, puis confirme à l'utilisateur
                setShowAppSettings(false);
                Alert.alert(
                  '✅ Historique supprimé',
                  'Toutes vos conversations ont été supprimées avec succès.',
                );
              } else {
                Alert.alert(
                  'Erreur',
                  data.message || 'La suppression a échoué. Veuillez réessayer.',
                );
              }
            } catch (error) {
              if (__DEV__) { console.error('[ProfileScreen.clearHistory]', error); }
              Alert.alert(
                'Erreur réseau',
                'Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.',
              );
            } finally {
              setClearing(false);
            }
          },
        },
      ],
    );
  };

  // ── Aide & Support ────────────────────────────────────────────
  const openWhatsApp = () =>
    Linking.openURL('whatsapp://send?phone=+2250565697263&text=Bonjour, j%27ai besoin d%27aide avec ChatAndGo.');
  const openEmail = () =>
    Linking.openURL('mailto:support@chatandgo.ci?subject=Demande de support ChatAndGo');


  return (
    <View style={styles.root}>

      {/* ── Header brand (fond primaire + barre de statut) ────────── */}
      <View style={[styles.headerZone, { paddingTop: insets.top }]}>
        {/* Cercles décoratifs */}
        <View style={styles.blob1} />
        <View style={styles.blob2} />

        {/* Ligne titre */}
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Mon Profil</Text>
        </View>

        {/* Avatar + nom + zone — centré */}
        <View style={styles.heroSection}>
          {/* Photo de profil */}
          <View style={styles.avatarWrap}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>
                  {(firstName || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            
          </View>

          <Text style={styles.heroName}>{firstName || 'Utilisateur'}</Text>

          {zone ? (
            <View style={styles.zonePill}>
              <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={styles.zoneText}>{zone}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* ── Contenu scrollable ───────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Section : Informations ────────────────────────────────── */}
        <Text style={styles.sectionLabel}>INFORMATIONS</Text>
        <View style={styles.card}>
          <MenuItem
            icon="location-outline"
            iconColor="#0066FF"
            iconBg="#EBF3FF"
            label="Zone géographique"
            value={zone || 'Non définie'}
          />
          <Divider />
          <MenuItem
            icon="mail-outline"
            iconColor="#0066FF"
            iconBg="#EBF3FF"
            label="Email"
            value={email || 'Non renseigné'}
          />
          <Divider />
          <MenuItem
            icon="person-outline"
            iconColor="#FF9500"
            iconBg="#FFF3E0"
            label="Prénom"
            value={firstName || 'Non renseigné'}
          />
        </View>

        {/* ── Section : Paramètres ─────────────────────────────────── */}
        <Text style={styles.sectionLabel}>PARAMÈTRES</Text>
        <View style={styles.card}>

          <Divider />
          {/* Confidentialité — ouvre une modal avec la politique */}
          <MenuItem
            icon="lock-closed-outline"
            iconColor="#0066FF"
            iconBg="#EBF3FF"
            label="Confidentialité"
            onPress={() => setShowPrivacy(true)}
          />
          <Divider />

          {/* Paramètres de l'application — ouvre un sous-menu modal */}
          <MenuItem
            icon="settings-outline"
            iconColor={Colors.textLight}
            iconBg={Colors.gray}
            label="Paramètres de l'application"
            onPress={() => setShowAppSettings(true)}
          />
          <Divider />

          {/* Aide & Support — WhatsApp ou email */}
          <MenuItem
            icon="help-circle-outline"
            iconColor="#AF52DE"
            iconBg="#F4EAFF"
            label="Aide & Support"
            onPress={() =>
              Alert.alert(
                '💬 Aide & Support',
                'Comment pouvons-nous t’aider ?',
                [
                  { text: '❌ Fermer', style: 'cancel' },
                  { text: '📲 WhatsApp', onPress: openWhatsApp },
                  { text: '📧 Email', onPress: openEmail },
                ],
              )
            }
          />
        </View>

        {/* ── Déconnexion ──────────────────────────────────────────── */}
        <View style={styles.card}>
          <MenuItem
            icon="log-out-outline"
            label="Se déconnecter"
            danger
            onPress={handleLogout}
          />
        </View>

        {/* Version */}
        <Text style={styles.versionText}>ChatAndGo · v1.0.0</Text>

      </ScrollView>

      {/* ── Modale Confidentialité ────────────────────────────────── */}
      <AppModal visible={showPrivacy} title="🔒 Confidentialité" onClose={() => setShowPrivacy(false)}>
        <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
          <Text style={styles.modalSection}>Collecte des données</Text>
          <Text style={styles.modalText}>
            ChatAndGo collecte uniquement les informations nécessaires au bon fonctionnement du service :
            ton prénom, ta zone géographique et ton numéro de téléphone.
          </Text>
          <Text style={styles.modalSection}>Utilisation des données</Text>
          <Text style={styles.modalText}>
            Tes données sont utilisées pour personnaliser ta recherche d’artisans et prestataires.
            Elles ne sont jamais vendues à des tiers.
          </Text>
          <Text style={styles.modalSection}>Historique de conversation</Text>
          <Text style={styles.modalText}>
            Tes conversations avec l’IA sont conservées localement sur ton appareil.
            Tu peux les supprimer à tout moment depuis les Paramètres.
          </Text>
          <Text style={styles.modalSection}>Tes droits</Text>
          <Text style={styles.modalText}>
            Conformité RGPD/UEMOA : tu peux à tout moment demander la suppression de tes données
            en nous contactant via Aide & Support.
          </Text>
        </ScrollView>
      </AppModal>

      {/* ── Modale Paramètres de l’application ───────────────────── */}
      <AppModal visible={showAppSettings} title="⚙️ Paramètres" onClose={() => setShowAppSettings(false)}>
        <View>
          {/* Langue */}
          <Text style={styles.modalSection}>Langue de l’application</Text>
          <View style={styles.langRow}>
            {['🇫🇷 Français'].map((lang, i) => (
              <TouchableOpacity
                key={lang}
                style={[styles.langChip, i === 0 && styles.langChipActive]}
              >
                <Text style={[styles.langChipText, i === 0 && styles.langChipTextActive]}>{lang}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Vider l'historique */}
          <Text style={styles.modalSection}>Données</Text>
          <TouchableOpacity
            style={[styles.dangerRow, clearing && styles.dangerRowDisabled]}
            onPress={clearHistory}
            disabled={clearing}
            activeOpacity={0.8}
          >
            {clearing ? (
              // Spinner pendant l'appel API
              <ActivityIndicator size="small" color={Colors.error} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            )}
            <Text style={styles.dangerRowText}>
              {clearing ? 'Suppression en cours…' : "Vider tout l'historique"}
            </Text>
          </TouchableOpacity>

          {/* Version */}
          <View style={styles.appInfoRow}>
            <Text style={styles.appInfoLabel}>Version</Text>
            <Text style={styles.appInfoValue}>1.0.0 (build 42)</Text>
          </View>
          <View style={styles.appInfoRow}>
            <Text style={styles.appInfoLabel}>Plateforme</Text>
            <Text style={styles.appInfoValue}>{Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text>
          </View>
        </View>
      </AppModal>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  root: {
    flex: 1,
    backgroundColor: Colors.gray,
  },

  // ── Header brand ─────────────────────────────────────────────────
  headerZone: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 30,
    overflow: 'hidden',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  blob1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -70,
    right: -60,
  },
  blob2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -40,
    left: -40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    marginBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Hero (avatar + nom + zone)
  heroSection: {
    alignItems: 'center',
    gap: 8,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarFallback: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    borderWidth: 2.5,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  zonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  zoneText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '500',
  },

  // ── Scroll ───────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 16,
    gap: 0,
  },

  // ── Labels de section ────────────────────────────────────────────
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textLight,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 16,
  },

  // ── Carte ────────────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  // ── Ligne de menu ────────────────────────────────────────────────
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  menuBody: {
    flex: 1,
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '500',
    marginBottom: 2,
  },
  menuValue: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },
  menuSingleText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },

  // ── Divider ──────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: Colors.gray,
    marginLeft: 54,   // aligné après l'icône
  },

  // ── Version ──────────────────────────────────────────────────────
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 24,
  },

  // ── Modales ──────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  modalSection: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textLight,
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },

  // ── Sélecteur de langue ──────────────────────────────────────────
  langRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  langChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  langChipActive: {
    backgroundColor: '#EBF3FF',
    borderColor: Colors.primary,
  },
  langChipText: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '500',
  },
  langChipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // ── Zone danger (vider historique) ──────────────────────────────
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFEBEB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  dangerRowText: {
    color: Colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
  // Appliqué quand l'appel API de suppression est en cours
  dangerRowDisabled: {
    opacity: 0.6,
  },

  // ── Infos appli ──────────────────────────────────────────────────
  appInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray,
  },
  appInfoLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  appInfoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
});


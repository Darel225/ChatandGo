import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useUserStore } from '../../store/useUserStore';

// URL de base du webhook n8n (identique à authService)
const N8N_BASE_URL = 'https://chatandgo-backend.onrender.com';

// ─── Données statiques des catégories ─────────────────────────
const CATEGORIES = [
  { id: '1', name: 'Plombier',    icon: 'water-outline',      color: '#3B82F6' },
  { id: '2', name: 'Électricien', icon: 'flash-outline',      color: '#F59E0B' },
  { id: '3', name: 'Livraison',    icon: 'bicycle-outline',    color: '#10B981' },
  { id: '4', name: 'Nettoyage',    icon: 'sparkles-outline',   color: '#8B5CF6' },
  { id: '5', name: 'Menuisier',    icon: 'hammer-outline',     color: '#EF4444' },
  { id: '6', name: 'Peinture',     icon: 'brush-outline',      color: '#EC4899' },
];

// ─── Composant principal ──────────────────────────────────────
export default function HomeScreen() {
  const { firstName, zone, avatar, email } = useUserStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // État des contacts récents
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // ─── Récupération des contacts récents via n8n ──────────────
  useFocusEffect(
    useCallback(() => {
      async function fetchRecentContacts() {
        if (!email) return;

        setLoadingContacts(true);
        try {
          const response = await fetch(`${N8N_BASE_URL}/webhook/get-recent-contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });

          if (!response.ok) {
            throw new Error(`Erreur serveur : ${response.status}`);
          }

          const text = await response.text();
          const data = text ? JSON.parse(text) : {};

          if (data.success && Array.isArray(data.contacts)) {
            setContacts(data.contacts);
          } else {
            setContacts([]);
          }
        } catch (error) {
          console.error('[HomeScreen.fetchRecentContacts]', error);
          setContacts([]);
        } finally {
          setLoadingContacts(false);
        }
      }

      fetchRecentContacts();
    }, [email])
  );

  // ─── Navigation ─────────────────────────────────────────────
  const handleSuggestion = (message) => {
    router.push({ pathname: '/(tabs)/ai-chat', params: { prefill: message } });
  };

  const handleSearchPress = () => {
    router.push('/(tabs)/ai-chat');
  };

  // ─── Actions des boutons des cartes ─────────────────────────

  // Appel téléphonique natif
  // NOTE : canOpenURL('tel:...') retourne TOUJOURS false sur Android 11+
  // sans la permission CALL_PHONE dans le manifest (restriction OS).
  // On ouvre directement comme pour WhatsApp — iOS et Android gèrent nativement le schéma tel:.
  const handleCall = async (telephone) => {
    if (!telephone) return;
    const url = `tel:${telephone}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('[HomeScreen.handleCall]', error);
      Alert.alert('Erreur', "Impossible de lancer l'appel. Vérifiez que le numéro est correct.");
    }
  };

  // Ouverture de WhatsApp ultra-robuste (version corrigée sans doublon)
  const handleWhatsApp = async (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert("Numéro indisponible", "Ce contact ne possède pas de numéro WhatsApp.");
      return;
    }

    try {
      // 1. Nettoyage strict : on ne garde que les chiffres purs
      const cleanNumber = phoneNumber.replace(/[^0-9]/g, ''); 
      
      // 2. Encodage obligatoire du message pour qu'iOS accepte le lien sans broncher
      const message = encodeURIComponent("Bonjour, je vous contacte depuis Chat&Go !");
      
      // 3. On utilise le lien universel (beaucoup plus fiable que whatsapp://)
      const url = `https://wa.me/${cleanNumber}?text=${message}`;

      // 4. On ouvre directement sans passer par canOpenURL (qui donne de fausses erreurs sur iOS)
      await Linking.openURL(url);

    } catch (error) {
      console.error('[HomeScreen.handleWhatsApp]', error);
      // Fallback si l'application ne peut vraiment pas s'ouvrir
      Alert.alert(
        "WhatsApp indisponible",
        "Impossible d'ouvrir WhatsApp. Souhaitez-vous appeler le prestataire à la place ?",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Appeler", onPress: () => Linking.openURL(`tel:${phoneNumber}`) }
        ]
      );
    }
  };

  // ─── Composant : état vide (pas encore de contacts) ─────────
  const EmptyContacts = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="chatbubbles-outline" size={32} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Pas encore de contacts</Text>
      <Text style={styles.emptyText}>
        Discutez avec notre assistant dans le Chat pour voir apparaître vos premiers prestataires ici !
      </Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/ai-chat')}>
        <Ionicons name="sparkles" size={14} color="#fff" />
        <Text style={styles.emptyBtnText}>Ouvrir le Chat IA</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Partie HAUTE (fixe) ────────────────────────────────────
  const FixedTop = (
    <>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.userInfo}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarMini} />
          ) : (
            <View style={[styles.avatarMini, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {(firstName || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.greeting}>
              Bonjour, <Text style={styles.greetingName}>{firstName || 'Utilisateur'} 👋</Text>
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={12} color={Colors.primary} />
              <Text style={styles.location}> {zone || 'Zone non définie'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Barre de recherche → ouvre le chat */}
      <View style={styles.searchSection}>
        <Text style={styles.searchTitle}>De quel service as-tu{'\n'}besoin aujourd'hui ?</Text>
        <TouchableOpacity style={styles.searchBar} onPress={handleSearchPress} activeOpacity={0.85}>
          <View style={styles.searchIconWrap}>
            <Ionicons name="search" size={18} color="#fff" />
          </View>
          <Text style={styles.searchPlaceholder}>Dis-moi ce qu'il te faut…</Text>
        </TouchableOpacity>
      </View>

      {/* Grille Catégories */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Catégories</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesRow}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={styles.categoryItem}
            onPress={() => handleSuggestion(`Salut, j'ai besoin d'un(e) ${cat.name.toLowerCase()} en urgence à ${zone || 'ma position'}.`)}
          >
            <View style={[styles.categoryIconWrap, { backgroundColor: `${cat.color}18` }]}>
              <Ionicons name={cat.icon} size={26} color={cat.color} />
            </View>
            <Text style={styles.categoryName}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Titre section contacts */}
      <View style={[styles.sectionHeader, { marginTop: 20 }]}>
        <Text style={styles.sectionTitle}>Contacts Récents</Text>
        {loadingContacts && (
          <ActivityIndicator size="small" color={Colors.primary} />
        )}
      </View>
    </>
  );

  // ─── Rendu ──────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {FixedTop}

      {!loadingContacts && contacts.length === 0 ? (
        <EmptyContacts />
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item, index) => `${item.telephone}-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contactList}
          renderItem={({ item: contact }) => (
            <View style={styles.contactCard}>
              <View style={styles.contactAvatar}>
                <Text style={styles.contactInitial}>
                  {(contact.nom || '?').charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.nom}</Text>
                <Text style={styles.contactJob}>{contact.metier}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.contactRating}>
                    {' '}{contact.note} · {contact.nombre_interventions} interventions
                  </Text>
                </View>
              </View>

              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.callBtn]}
                  onPress={() => handleCall(contact.telephone)}
                >
                  <Ionicons name="call" size={15} color="#fff" />
                  <Text style={styles.actionBtnText}>Appeler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.waBtn]}
                  onPress={() => handleWhatsApp(contact.whatsapp)}
                >
                  <Ionicons name="logo-whatsapp" size={15} color="#fff" />
                  <Text style={styles.actionBtnText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarMini: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2.5,
    borderColor: Colors.primary,
  },
  avatarFallback: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  greeting: {
    fontSize: 13,
    color: Colors.textLight,
  },
  greetingName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    color: Colors.textLight,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  searchTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    lineHeight: 30,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: Colors.textLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.text,
  },
  categoriesRow: {
    flexGrow: 0,
  },
  categoryItem: {
    alignItems: 'center',
    width: 72,
  },
  categoryIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}12`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  contactList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 4,
  },
  contactCard: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  contactAvatar: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  contactInfo: {
    marginLeft: 62,
    marginBottom: 14,
  },
  contactName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
  },
  contactJob: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  contactRating: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 12,
    gap: 5,
  },
  callBtn: {
    backgroundColor: Colors.primary,
  },
  waBtn: {
    backgroundColor: '#25D366',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
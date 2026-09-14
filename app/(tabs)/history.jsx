import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Colors from '../../constants/Colors';
import { useUserStore } from '../../store/useUserStore';

import { BASE_URL } from '../../constants/api';

// ─── Utilitaire : étiquette de section intelligente ───────────
// Reçoit une chaîne de date ISO (created_at) et retourne la section
function getSectionLabel(createdAt) {
  const now   = new Date();
  const date  = new Date(createdAt);
  const diff  = Math.floor((now - date) / 86_400_000); // jours entiers
  if (diff === 0)  return "Aujourd'hui";
  if (diff === 1)  return 'Hier';
  if (diff <= 6)   return 'Cette semaine';
  if (diff <= 13)  return 'La semaine dernière';
  if (diff <= 30)  return 'Ce mois-ci';
  return 'Plus anciennes';
}

// ─── Utilitaire : heure / date formatée selon l'ancienneté ────
function formatTime(createdAt) {
  const now  = new Date();
  const date = new Date(createdAt);
  const diff = Math.floor((now - date) / 86_400_000);
  if (diff === 0) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (diff <= 6)  return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ─── Utilitaire : regroupement des conversations par section ──
// Entrée  : tableau brut de conversations (chaque item a created_at)
// Sortie  : [{ label: 'Hier', items: [...] }, ...]
function groupBySection(items) {
  const order = [];
  const map   = {};
  for (const item of items) {
    const label = getSectionLabel(item.created_at);
    if (!map[label]) {
      map[label] = [];
      order.push(label);
    }
    map[label].push(item);
  }
  return order.map(label => ({ label, items: map[label] }));
}

// ─── Couleur et icône selon le statut de la conversation ──────
function getStatusStyle(statut) {
  switch (statut) {
    case 'Terminé':  return { color: Colors.success,   dot: Colors.success };
    case 'En cours': return { color: Colors.primary,   dot: Colors.primary };
    case 'Fermé':    return { color: Colors.textLight, dot: Colors.textLight };
    default:         return { color: Colors.textLight, dot: Colors.textLight };
  }
}

// ─── Couleur de l'icône de catégorie selon le titre ───────────
// Fallback générique si pas de catégorie transmise
const ICON_DEFAULTS = {
  icon:    'chatbubble-ellipses-outline',
  color:   Colors.primary,
  bg:      `${Colors.primary}15`,
};

// ─── Carte de conversation ─────────────────────────────────────
const HistoryCard = ({ item, onPress }) => {
  const scale    = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  const statusStyle = getStatusStyle(item.statut);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        style={styles.card}
      >
        {/* Icône de la conversation */}
        <View style={[styles.cardIcon, { backgroundColor: ICON_DEFAULTS.bg }]}>
          <Ionicons name={ICON_DEFAULTS.icon} size={20} color={ICON_DEFAULTS.color} />
        </View>

        {/* Texte principal */}
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.titre}</Text>
            <Text style={styles.cardTime}>{formatTime(item.created_at)}</Text>
          </View>

          {/* Sous-titre / résumé de la demande */}
          {item.sous_titre ? (
            <Text style={styles.cardDetails} numberOfLines={1}>{item.sous_titre}</Text>
          ) : null}

          {/* Badge de statut */}
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
            <Text style={[styles.statusText, { color: statusStyle.color }]}>
              {item.statut || 'Inconnu'}
            </Text>
          </View>
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={16} color={Colors.border} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── État vide ─────────────────────────────────────────────────
const EmptyHistory = ({ onGoToChat }) => (
  <View style={styles.empty}>
    <View style={styles.emptyIcon}>
      <Ionicons name="chatbubble-ellipses-outline" size={38} color={Colors.primary} />
    </View>
    <Text style={styles.emptyTitle}>Aucune demande trouvée</Text>
    <Text style={styles.emptyText}>
      Lance une nouvelle recherche dans le Chat pour voir tes conversations apparaître ici !
    </Text>
    <TouchableOpacity style={styles.emptyBtn} onPress={onGoToChat}>
      <Ionicons name="sparkles" size={14} color="#fff" />
      <Text style={styles.emptyBtnText}>Ouvrir le Chat IA</Text>
    </TouchableOpacity>
  </View>
);

// ─── Écran principal ───────────────────────────────────────────
export default function HistoryScreen() {
  const insets              = useSafeAreaInsets();
  const router              = useRouter();
  const { avatar, firstName, email } = useUserStore();

  // État de la liste et du chargement
  const [conversations, setConversations] = useState([]);
  const [loading,       setLoading]       = useState(false);

  // État de la barre de recherche
  const [query, setQuery] = useState('');

  // ─── Récupération de l'historique via n8n ─────────────────────
  // Même pattern que HomeScreen : async déclarée à l'intérieur du
  // useCallback pour respecter la règle "pas de Promise retournée"
  useFocusEffect(
    useCallback(() => {
      async function fetchHistory() {
        if (!email) return;

        setLoading(true);
        try {
          const response = await fetch(`${BASE_URL}/history/get-history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });

          if (!response.ok) {
            throw new Error(`Erreur serveur : ${response.status}`);
          }

          // Lecture sécurisée pour éviter "Unexpected end of input"
          const text = await response.text();
          const data = text ? JSON.parse(text) : {};

          if (data.success && Array.isArray(data.conversations)) {
            setConversations(data.conversations);
          } else {
            setConversations([]);
          }
        } catch (error) {
          if (__DEV__) { console.error('[HistoryScreen.fetchHistory]', error); }
          // Pas d'alerte pour ne pas perturber l'UX : état vide affiché
          setConversations([]);
        } finally {
          setLoading(false);
        }
      }

      // Appel immédiat de la fonction async
      fetchHistory();
    }, [email])
  );

  // ─── Filtre de recherche en temps réel ────────────────────────
  // Filtre sur titre ET sous_titre, insensible à la casse
  const filteredConversations = query.trim()
    ? conversations.filter(item => {
        const q = query.toLowerCase();
        return (
          (item.titre     || '').toLowerCase().includes(q) ||
          (item.sous_titre || '').toLowerCase().includes(q)
        );
      })
    : conversations;

  // Regroupement par section temporelle
  const sections = groupBySection(filteredConversations);

  // ─── Navigation vers le chat avec session_id ──────────────────
  const openConversation = (item) => {
    router.push({
      pathname: '/(tabs)/ai-chat',
      params: {
        sessionId: item.session_id,
        titre:     item.titre,
      },
    });
  };

  // ─── Rendu ────────────────────────────────────────────────────
  return (
    <View style={styles.root}>

      {/* ── Zone brand (status bar + header) ─────────────────── */}
      <View style={[styles.darkZone, { paddingTop: insets.top }]}>

        {/* Cercles décoratifs — profondeur visuelle */}
        <View style={styles.blob1} />
        <View style={styles.blob2} />

        {/* Ligne utilisateur */}
        <View style={styles.darkInner}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{(firstName || 'U').charAt(0)}</Text>
            </View>
          )}

          <View style={styles.darkText}>
            <Text style={styles.darkGreeting}>
              Bonjour <Text style={styles.darkName}>{firstName || 'toi'}</Text> 👋
            </Text>
            <Text style={styles.darkSub}>
              Retrouve tes conversations passées
            </Text>
          </View>
        </View>

        {/* Barre de recherche fonctionnelle */}
        <View style={styles.searchPill}>
          <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.65)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une conversation..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="never"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Feuille blanche (bottom-sheet style) ─────────────── */}
      <View style={styles.sheet}>

        {/* Poignée + titre + compteur */}
        <View style={styles.sheetHandle} />
        <View style={styles.sheetTitleRow}>
          <Text style={styles.sheetTitle}>DEMANDES PRÉCÉDENTES</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredConversations.length}</Text>
          </View>
        </View>

        {/* ── Contenu conditionnel ──────────────────────────── */}

        {/* 1. Chargement en cours */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Chargement de l'historique…</Text>
          </View>

        /* 2. Liste vide (pas de résultat ou aucune conversation) */
        ) : sections.length === 0 ? (
          <EmptyHistory onGoToChat={() => router.push('/(tabs)/ai-chat')} />

        /* 3. Liste des conversations regroupées par section */
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {sections.map(({ label, items }) => (
              <View key={label} style={styles.section}>

                {/* Label de section en majuscules */}
                <Text style={styles.sectionLabel}>{label.toUpperCase()}</Text>

                {/* Cartes avec séparateurs */}
                {items.map((item, idx) => (
                  <View key={item.id || item.session_id || idx}>
                    <HistoryCard
                      item={item}
                      onPress={() => openConversation(item)}
                    />
                    {/* Séparateur sauf après la dernière carte */}
                    {idx < items.length - 1 && <View style={styles.separator} />}
                  </View>
                ))}

              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({

  root: {
    flex: 1,
    // Même couleur que le header → aucune rupture visuelle
    backgroundColor: Colors.primary,
  },

  // ── Zone brand ────────────────────────────────────────────────
  darkZone: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -50,
    right: -40,
  },
  blob2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 0,
    left: -30,
  },
  darkInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 14,
    marginBottom: 16,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarFallback: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '700',
  },
  darkText: {
    flex: 1,
  },
  darkGreeting: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  darkName: {
    fontWeight: '800',
  },
  darkSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    marginTop: 2,
  },

  // ── Barre de recherche ────────────────────────────────────────
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },

  // ── Bottom sheet ──────────────────────────────────────────────
  sheet: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 18,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray,
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.6,
    flex: 1,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Chargement ────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 60,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textLight,
  },

  // ── Scroll ────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // ── Section ───────────────────────────────────────────────────
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textLight,
    letterSpacing: 0.7,
    marginBottom: 12,
  },

  // ── Carte ─────────────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  cardTime: {
    fontSize: 12,
    color: Colors.textLight,
    flexShrink: 0,
  },
  cardDetails: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 5,
    lineHeight: 17,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.gray,
    marginLeft: 58, // aligné après l'icône
  },

  // ── État vide ─────────────────────────────────────────────────
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
    gap: 12,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#EBF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
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
});


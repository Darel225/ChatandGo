import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BASE_URL } from '../../constants/api';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useUserStore } from '../../store/useUserStore';
import { chatService } from '../../services/chatService';
import ChatBubble from '../../components/chat/ChatBubble';
import TypingIndicator from '../../components/chat/TypingIndicator';

export default function AiChatScreen() {
  const { avatar, firstName, sessionId: storeSessionId, email, quartier } = useUserStore();
  const { prefill, sessionId: historySessionId, titre } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);

  const activeSessionId = historySessionId || storeSessionId;

  const [message, setMessage] = useState(prefill || '');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (prefill) {
      setMessage(prefill);
    }
  }, [prefill]);

  // ─── Réinitialisation au focus (retour sur l'écran) ────────────
  // Déclenché à chaque fois que l'onglet Chat redevient actif.
  // Si aucun historySessionId n'est présent (pas de session d'historique
  // sélectionnée), on réinitialise proprement l'état pour garantir
  // qu'un historique vidé depuis les Paramètres n'affiche plus les anciens
  // messages encore en mémoire.
  useFocusEffect(
    useCallback(() => {
      if (!historySessionId) {
        // Nouvelle conversation ou retour après suppression de l'historique
        setMessages([]);
        setLoadingHistory(false);
      }
      // Pas de cleanup nécessaire : les états sont gérés localement
    }, [historySessionId])
  );

  // ─── Chargement de l'historique de conversation ─────────────
  useEffect(() => {
    if (!historySessionId) return;

    async function loadConversation() {
      setLoadingHistory(true);
      try {
        const response = await fetch(
          `${BASE_URL}/history/get-conversation`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: historySessionId, email: email }),
          }
        );

        const text = await response.text();
        const data = text ? JSON.parse(text) : {};

        // Récupération sécurisée du tableau des messages
        const rows = data.messages || (Array.isArray(data) ? data : []);

        if (rows && rows.length > 0) {
          const loadedMessages = [];

          rows.forEach((row, index) => {
            // 1. Message de l'utilisateur (clé exacte : message_user)
            if (row.message_user) {
              loadedMessages.push({
                id: `user-${row.id || index}`,
                text: row.message_user,
                isUser: true,
                time: row.timestamp ? new Date(row.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''
              });
            }

            // 2. Réponse de l'agent (clé exacte : reponse_agent)
            if (row.reponse_agent) {
              let parsedProviders = [];
              try {
                parsedProviders = typeof row.prestataires_proposes === 'string'
                  ? JSON.parse(row.prestataires_proposes)
                  : (row.prestataires_proposes || []);
              } catch (e) {
                parsedProviders = [];
              }

              loadedMessages.push({
                id: `bot-${row.id || index}`,
                text: row.reponse_agent,
                isUser: false,
                time: row.timestamp ? new Date(row.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '',
                providers: parsedProviders
              });
            }
          });

          setMessages(loadedMessages);
        } else {
          // La session n'existe plus en base (historique vidé ou introuvable) :
          // réinitialise silencieusement en mode "nouvelle conversation vide"
          if (__DEV__) { console.warn('[AiChatScreen] Session introuvable ou vide — réinitialisation.'); }
          setMessages([]);
        }
      } catch (error) {
        if (__DEV__) { console.error('❌ Erreur chargement historique :', error); }
      } finally {
        setLoadingHistory(false);
      }
    }

    loadConversation();
  }, [historySessionId]);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);
  }, [messages, loading]);

  const now = () => {
    const d = new Date();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleSend = async () => {
    const text = message.trim();
    if (!text) return;
    setMessage('');

    const userMsg = { id: Date.now().toString(), text, isUser: true, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await chatService.sendMessage(text, activeSessionId, email, quartier);

      const botMsgText = response.reponse_texte || (response.prestataires && response.prestataires.length > 0 ? "Voici ce que j'ai trouvé :" : "Je n'ai pas bien compris, pouvez-vous reformuler ?");

      const botMsg = {
        id: (Date.now() + 1).toString(),
        text: botMsgText,
        isUser: false,
        time: now(),
        providers: response.prestataires || []
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      if (__DEV__) { console.error(e); }
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "Désolé, une erreur est survenue lors de la communication avec le serveur.",
        isUser: false,
        time: now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <ChatBubble
      message={item}
      isUser={item.isUser}
      userAvatar={avatar}
      userFirstName={firstName}
    />
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.select({ ios: 'padding', android: 'height' })}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAiAvatar}>
            <Ionicons name="sparkles" size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {titre || <Text>Assistant Chat<Text style={{ color: Colors.primary }}>Go</Text></Text>}
            </Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>
                {historySessionId ? 'Conversation précédente' : 'En ligne · répond instantanément'}
              </Text>
            </View>
          </View>
        </View>

        {avatar
          ? <Image source={{ uri: avatar }} style={styles.headerUserAvatar} />
          : (
            <View style={[styles.headerUserAvatar, styles.userAvatarFallback]}>
              <Text style={[styles.userAvatarInitial, { fontSize: 14 }]}>{(firstName || 'U').charAt(0)}</Text>
            </View>
          )
        }
      </View>

      {loadingHistory ? (
        <View style={styles.historyLoadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.historyLoadingText}>Chargement de la conversation…</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.dateChip}>
              <Text style={styles.dateText}>
                {historySessionId
                  ? (titre || 'Conversation précédente')
                  : "Aujourd'hui"}
              </Text>
            </View>
          }
          ListFooterComponent={
            loading ? (
              <View style={styles.loadingRow}>
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={16} color={Colors.primary} />
                </View>
                <View style={[styles.bubble, styles.bubbleAI, { paddingVertical: 14 }]}>
                  <TypingIndicator />
                </View>
              </View>
            ) : null
          }
        />
      )}

      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.attachBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="add-circle-outline" size={24} color={Colors.textLight} />
        </TouchableOpacity>

        <View style={[styles.inputWrap, message.length > 0 && styles.inputWrapActive]}>
          <TextInput
            style={styles.input}
            placeholder="Exprime ton besoin…"
            placeholderTextColor={Colors.textLight}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
            returnKeyType="default"
            blurOnSubmit={false}
          />
          {!message.trim() && (
            <TouchableOpacity style={styles.micBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="mic-outline" size={19} color={Colors.textLight} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!message.trim() || loading}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Ionicons name="send" size={16} color="#fff" style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F6FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAiAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  onlineText: { fontSize: 11, color: Colors.textLight },
  headerUserAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: Colors.primary },
  userAvatarFallback: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  userAvatarInitial: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  chatContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  dateChip: {
    alignSelf: 'center',
    backgroundColor: '#DDE1EA',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 20,
  },
  dateText: { fontSize: 11, color: Colors.textLight, fontWeight: '500', letterSpacing: 0.3 },
  loadingRow: { flexDirection: 'row', marginBottom: 18, alignItems: 'flex-end', gap: 8, justifyContent: 'flex-start' },
  aiAvatar: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: `${Colors.primary}18`,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  bubble: { paddingHorizontal: 15, paddingVertical: 11, borderRadius: 20 },
  bubbleAI: { backgroundColor: Colors.background, borderBottomLeftRadius: 5, borderWidth: 1, borderColor: Colors.border },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 6,
  },
  attachBtn: { paddingBottom: 6 },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.gray,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 13,
    paddingVertical: 8,
    maxHeight: 120,
  },
  inputWrapActive: { borderColor: Colors.primary, backgroundColor: '#fff' },
  input: { flex: 1, fontSize: 15, color: Colors.text, maxHeight: 100, lineHeight: 20, paddingTop: 0, paddingBottom: 0 },
  micBtn: { paddingLeft: 6, alignSelf: 'flex-end', paddingBottom: 2 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginBottom: 1,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  sendBtnDisabled: { backgroundColor: Colors.border, shadowOpacity: 0, elevation: 0 },
  historyLoadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingBottom: 60 },
  historyLoadingText: { fontSize: 14, color: Colors.textLight },
});

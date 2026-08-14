import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import ProviderCard from './ProviderCard';

export default function ChatBubble({ message, isUser, userAvatar, userFirstName }) {
  // Fonction pour parser et afficher le texte en gras
  const renderFormattedText = (text) => {
    if (!text) return null;
    
    // Sépare le texte à chaque fois qu'il trouve des balises **
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Enlève les ** et applique le style gras
        return (
          <Text key={index} style={{ fontWeight: 'bold' }}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  return (
    <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAI]}>
      {/* Avatar IA côté gauche */}
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={16} color={Colors.primary} />
        </View>
      )}

      <View style={[styles.msgColumn, isUser && { alignItems: 'flex-end' }]}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
            {renderFormattedText(message.text)}
          </Text>
        </View>

        {/* Cartes prestataires si présentes */}
        {!isUser && message.providers && message.providers.length > 0 && (
          message.providers.map((provider, index) => (
            <ProviderCard key={provider.id || index} provider={provider} />
          ))
        )}

        <Text style={styles.timeText}>{message.time}</Text>
      </View>

      {/* Avatar utilisateur côté droit */}
      {isUser && (
        userAvatar
          ? <Image source={{ uri: userAvatar }} style={styles.userAvatar} />
          : (
            <View style={[styles.userAvatar, styles.userAvatarFallback]}>
              <Text style={styles.userAvatarInitial}>{(userFirstName || 'U').charAt(0)}</Text>
            </View>
          )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  msgRow: {
    flexDirection: 'row',
    marginBottom: 18,
    alignItems: 'flex-end',
    gap: 8,
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  msgRowAI: {
    justifyContent: 'flex-start',
  },
  msgColumn: {
    maxWidth: '85%', // Un peu plus large pour les cartes
  },
  aiAvatar: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: `${Colors.primary}18`,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    flexShrink: 0,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  userAvatarFallback: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  bubble: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 20,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 5,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  bubbleAI: {
    backgroundColor: Colors.background,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: '#fff',
  },
  bubbleTextAI: {
    color: Colors.text,
  },
  timeText: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 5,
    marginHorizontal: 4,
  },
});
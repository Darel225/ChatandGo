import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

export default function ProviderCard({ provider }) {
  const handleCall = async () => {
    if (!provider.tel_url) return;
    // canOpenURL('tel:...') retourne false sur Android 11+ sans CALL_PHONE permission.
    // On ouvre directement — les deux OS gèrent nativement le schéma tel:.
    try {
      await Linking.openURL(provider.tel_url);
    } catch (error) {
      console.error("Erreur lors de l'appel:", error);
      Alert.alert("Erreur", "Impossible de lancer l'appel. Vérifiez que le numéro est correct.");
    }
  };

  const handleWhatsApp = async () => {
    if (!provider.whatsapp_url) return;
    
    try {
      // On force l'ouverture directe du lien universel https://wa.me/...
      // Cela évite le bug de "canOpenURL" sur iOS / Simulateur
      await Linking.openURL(provider.whatsapp_url);
    } catch (error) {
      console.error("Erreur WhatsApp:", error);
      // Plan de secours intelligent si le navigateur ou l'app plante
      Alert.alert(
        "WhatsApp indisponible",
        "Impossible d'ouvrir le lien. Souhaitez-vous appeler le prestataire ?",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Appeler", onPress: handleCall } // On redirige vers l'appel classique
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Badge IA */}
      <View style={styles.aiTag}>
        <Ionicons name="sparkles" size={11} color={Colors.primary} />
        <Text style={styles.aiTagText}>Recommandé par l'IA</Text>
      </View>

      <View style={styles.row}>
        {/* Avatar initiale */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(provider.nom || 'P').charAt(0)}</Text>
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{provider.nom_complet}</Text>
            {provider.verified && (
              <Ionicons name="checkmark-circle" size={15} color={Colors.success} style={{ marginLeft: 4 }} />
            )}
          </View>
          
          <Text style={styles.job} numberOfLines={1}>
            {provider.categorie} {provider.sous_categorie ? `- ${provider.sous_categorie}` : ''}
          </Text>
          
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color={Colors.textLight} />
            <Text style={styles.meta}> {provider.quartier}, {provider.ville}</Text>
          </View>

          {provider.tarif_affiche && (
            <View style={styles.metaRow}>
              <Ionicons name="cash-outline" size={12} color={Colors.textLight} />
              <Text style={styles.meta}> {provider.tarif_affiche}</Text>
            </View>
          )}

          {provider.note_affichee && (
            <View style={styles.metaRow}>
              <Text style={styles.meta}> {provider.note_affichee}</Text>
            </View>
          )}
        </View>
      </View>

      {provider.description && (
        <Text style={styles.description} numberOfLines={2}>
          {provider.description}
        </Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.callBtn]} onPress={handleCall}>
          <Ionicons name="call" size={15} color="#fff" />
          <Text style={styles.btnText}>Appeler</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.btn, styles.waBtn]} onPress={handleWhatsApp}>
          <Ionicons name="logo-whatsapp" size={15} color="#fff" />
          <Text style={styles.btnText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    backgroundColor: '#F0F7FF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C8DEFF',
    width: '100%',
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  aiTagText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: 'bold', color: Colors.text, flexShrink: 1 },
  job: { fontSize: 12, color: Colors.textLight, marginTop: 2, textTransform: 'capitalize' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  meta: { fontSize: 12, color: Colors.textLight },
  description: {
    fontSize: 13,
    color: Colors.text,
    marginBottom: 14,
    lineHeight: 18,
  },
  actions: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 12,
    gap: 6,
  },
  callBtn: { backgroundColor: Colors.primary },
  waBtn: { backgroundColor: '#25D366' },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

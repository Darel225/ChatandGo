import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

export default function ProviderCard({ provider }) {
  // Fallback telephone: extract only numbers and + from any available phone field
  const cleanPhone = (provider.telephone || provider.whatsapp || provider.tel_url || provider.phone || "").replace(/[^0-9+]/g, "");
  const telUrl = provider.tel_url || (cleanPhone ? `tel:${cleanPhone}` : null);
  const waUrl = provider.whatsapp_url || (cleanPhone ? `https://wa.me/${cleanPhone}` : null);

  const handleCall = async () => {
    if (!telUrl) return;
    try {
      await Linking.openURL(telUrl);
    } catch (error) {
      if (__DEV__) { console.error("Erreur lors de l'appel:", error); }
      Alert.alert("Erreur", "Impossible de lancer l'appel. Vérifiez que le numéro est correct.");
    }
  };

  const handleWhatsApp = async () => {
    if (!waUrl) return;
    try {
      await Linking.openURL(waUrl);
    } catch (error) {
      if (__DEV__) { console.error("Erreur WhatsApp:", error); }
      Alert.alert(
        "WhatsApp indisponible",
        "Impossible d'ouvrir le lien. Souhaitez-vous appeler le prestataire ?",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Appeler", onPress: handleCall }
        ]
      );
    }
  };

  const handleMaps = async () => {
    const url = provider.maps_url;
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (error) {
      if (__DEV__) { console.error("Erreur Google Maps:", error); }
      Alert.alert("Erreur", "Impossible d'ouvrir Google Maps.");
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

      {/* Ligne 1 : Appeler + WhatsApp */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.btn, styles.callBtn, !telUrl && { backgroundColor: '#A0C4FF' }]} 
          onPress={handleCall}
          disabled={!telUrl}
          activeOpacity={0.7}
        >
          <Ionicons name="call" size={15} color="#fff" />
          <Text style={styles.btnText}>Appeler</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btn, styles.waBtn, !waUrl && { backgroundColor: '#85E0A3' }]} 
          onPress={handleWhatsApp}
          disabled={!waUrl}
          activeOpacity={0.7}
        >
          <Ionicons name="logo-whatsapp" size={15} color="#fff" />
          <Text style={styles.btnText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>

      {/* Ligne 2 : Itinéraire (pleine largeur) */}
      {provider.maps_url ? (
        <TouchableOpacity style={[styles.btn, styles.mapsBtn]} onPress={handleMaps}>
          <Ionicons name="navigate-outline" size={15} color="#fff" />
          <Text style={styles.btnText}>Itinéraire</Text>
        </TouchableOpacity>
      ) : null}
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
  actions: { flexDirection: 'row', gap: 10, marginBottom: 10 },
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
  mapsBtn: { backgroundColor: '#EA4335', marginBottom: 0 },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});


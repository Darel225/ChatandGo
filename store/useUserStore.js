import { create } from 'zustand';

// Génère un identifiant de session unique à chaque démarrage de l'application
const generateSessionId = () => Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);

export const useUserStore = create((set) => ({
  // ─── Données de session ──────────────────────────────────────
  isAuthenticated: false,
  sessionId: generateSessionId(),

  // ─── Données de l'utilisateur (remplies après authentification) ─
  userId: null,       // ID en base de données (table users)
  firstName: null,    // Prénom affiché dans l'UI
  nom: null,          // Nom de famille (depuis la BDD)
  prenom: null,       // Prénom complet (depuis la BDD)
  whatsapp: null,     // Numéro WhatsApp au format international (+225XXXXXXXXXX)
  avatar: null,       // URI local de la photo de profil
  zone: null,         // Quartier / commune de l'utilisateur
  phone: null,        // Alias pour compatibilité ascendante
  ville: null,        // Ville par défaut (depuis la BDD)
  quartier: null,     // Quartier par défaut (depuis la BDD)

  // ─── Actions ─────────────────────────────────────────────────

  /**
   * Met à jour les données utilisateur dans le store.
   * Appelé lors du setup du profil ou après une reconnexion.
   */
  setUserData: (data) => set((state) => ({ ...state, ...data })),

  /**
   * Marque l'utilisateur comme authentifié.
   */
  login: () => set({ isAuthenticated: true }),

  /**
   * Réinitialise complètement le store et génère un nouveau sessionId.
   * Appelé lors de la déconnexion.
   */
  logout: () => set({
    isAuthenticated: false,
    userId: null,
    firstName: null,
    nom: null,
    prenom: null,
    whatsapp: null,
    avatar: null,
    zone: null,
    phone: null,
    ville: null,
    quartier: null,
    sessionId: generateSessionId(),
  }),
}));

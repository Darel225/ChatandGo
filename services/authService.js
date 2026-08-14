// URL de base de notre instance n8n
const N8N_BASE_URL = 'https://chatandgo-backend.onrender.com';

export const authService = {

  /**
   * Demande l'envoi d'un code OTP à l'adresse e-mail fournie.
   * @param {string} email - L'adresse e-mail de l'utilisateur
   * @returns {Promise<{ success: boolean }>}
   */
  requestOtp: async (email) => {
    try {
      const response = await fetch(`${N8N_BASE_URL}/webhook/auth-request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur lors de la demande OTP : ${response.status}`);
      }

      // Lecture sécurisée : on lit le texte brut avant de parser en JSON
      // pour éviter l'erreur "Unexpected end of input" si la réponse est vide
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      return data;
    } catch (error) {
      console.error('[authService.requestOtp]', error);
      throw new Error("Impossible d'envoyer le code. Vérifiez votre connexion et réessayez.");
    }
  },

  /**
   * Vérifie le code OTP saisi par l'utilisateur.
   * @param {string} email - L'adresse e-mail de l'utilisateur
   * @param {string} code - Le code OTP à 4 chiffres
   * @returns {Promise<{ isValid: boolean, isNewUser: boolean, user: object|null }>}
   */
  verifyOtp: async (email, code) => {
    try {
      const response = await fetch(`${N8N_BASE_URL}/webhook/auth-verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur lors de la vérification OTP : ${response.status}`);
      }

      // Lecture sécurisée : on lit le texte brut avant de parser en JSON
      // pour éviter l'erreur "Unexpected end of input" si la réponse est vide
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      // Structure attendue : { isValid: bool, isNewUser: bool, user: { id, nom, prenom, email, ville_par_defaut, quartier_par_defaut } | null }
      return data;
    } catch (error) {
      console.error('[authService.verifyOtp]', error);
      throw new Error('La vérification a échoué. Veuillez réessayer.');
    }
  },

  /**
   * Met à jour le profil d'un nouvel utilisateur après la vérification OTP.
   * @param {object} profileData - Les données du profil à envoyer
   * @param {string} profileData.email      - E-mail de l'utilisateur connecté
   * @param {string} profileData.nom        - Nom de famille
   * @param {string} profileData.prenom     - Prénom (peut être vide "")
   * @param {string} profileData.quartier   - Quartier / commune saisi
   * @param {string} profileData.photo_url  - URI local de la photo ou "" si aucune photo
   * @returns {Promise<{ success: boolean, message: string, user: object }>}
   */
  updateProfile: async ({ email, nom, prenom, quartier, photo_url }) => {
    try {
      const response = await fetch(`${N8N_BASE_URL}/webhook/update-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nom, prenom, quartier, photo_url }),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur lors de la mise à jour du profil : ${response.status}`);
      }

      // Lecture sécurisée : on lit le texte brut avant de parser en JSON
      // pour éviter l'erreur "Unexpected end of input" si la réponse est vide
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      // Structure attendue : { success: bool, message: string, user: { ... } }
      return data;
    } catch (error) {
      console.error('[authService.updateProfile]', error);
      throw new Error('La mise à jour du profil a échoué. Veuillez réessayer.');
    }
  },
};

import { BASE_URL } from '../constants/api';

export const chatService = {
  async sendMessage(message, sessionId, email, userLocation) {
    try {
      const response = await fetch(`${BASE_URL}/chat/convcommerce`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          session_id: sessionId,
          email,
          user_location: userLocation || "Abidjan"
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (__DEV__) { console.error('Erreur chatService.sendMessage:', error); }
      throw error;
    }
  },
};

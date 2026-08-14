const N8N_WEBHOOK_URL = 'https://chatandgo-backend.onrender.com/webhook/convcommerce';

export const chatService = {
  async sendMessage(message, sessionId) {
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return data;
    } catch (error) {
      console.error('Erreur chatService.sendMessage:', error);
      throw error; // Re-throw to handle it in the UI
    }
  },
};

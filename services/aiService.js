import { apiClient } from './apiClient';

export const aiService = {
  // Envoyer un message à l'IA
  sendMessage: async (message) => {
    // Simule un délai de réponse de l'IA
    return await new Promise((resolve) => setTimeout(() => {
      resolve({
        id: Date.now().toString(),
        text: "Je peux certainement vous aider. Voici ce que j'ai trouvé pour vous :",
        isUser: false,
        // Potentiellement une carte artisan jointe
        provider: {
          id: '1',
          name: 'Moussa Diaby',
          job: 'Plombier',
          distance: '5km',
          rating: 4.8
        }
      });
    }, 1500));
  }
};

// services/apiClient.js
// Configuration de base pour les requêtes réseau (axios ou fetch)

export const apiClient = {
  // Simule un appel GET
  get: async (url) => {
    if (__DEV__) { console.log(`GET ${url}`); }
    return { data: {} };
  },
  // Simule un appel POST
  post: async (url, data) => {
    if (__DEV__) { console.log(`POST ${url}`, data); }
    return { data: {} };
  }
};


# 📱 ChatAndGo

**ChatAndGo** est une application mobile innovante de commerce conversationnel (Conversational Commerce) basée sur l'intelligence artificielle. L'application permet aux utilisateurs de discuter avec un assistant virtuel IA pour exprimer leurs besoins (déménagement, plomberie, électricité, etc.) et recevoir instantanément des recommandations de prestataires qualifiés et vérifiés à proximité.

---

## 🌟 Fonctionnalités Principales

- **🤖 Assistant IA Intégré** : Un chat intelligent capable de comprendre le besoin de l'utilisateur et d'extraire les informations pertinentes (type de besoin, budget, localisation).
- **👷 Recommandations de Prestataires** : L'IA suggère des cartes de prestataires enrichies (Nom, métier, note, tarif, zone) directement dans la conversation.
- **📞 Action Directe** : Contactez les prestataires en un clic via un Appel Téléphonique natif ou via WhatsApp.
- **🔐 Authentification Sécurisée (OTP)** : Connexion fluide et sans mot de passe via un code OTP envoyé par email, géré par notre backend n8n.
- **🗂️ Historique Dynamique** : Retrouvez toutes vos conversations passées, automatiquement classées par date (Aujourd'hui, Hier, Cette semaine, etc.), avec une barre de recherche intégrée.
- **👤 Profil Utilisateur** : Gestion des informations personnelles (nom, email, zone) et paramètres de l'application.

---

## 🛠️ Stack Technique

### Frontend (Mobile)
- **Framework** : React Native avec [Expo Router](https://docs.expo.dev/router/introduction/) (Architecture basée sur le système de fichiers).
- **State Management** : [Zustand](https://github.com/pmndrs/zustand) pour une gestion d'état globale ultra-légère et performante.
- **Design & UI** : Composants personnalisés fluides avec animations natives (Animated API).
- **Navigation** : Expo Router (`/(auth)`, `/(tabs)`).

### Backend & Données
- **Logique Métier & API** : Webhooks dynamiques via **[n8n](https://n8n.io/)** (Automatisation de flux).
- **Base de Données** : **PostgreSQL** (hébergé sur Neon) pour stocker les utilisateurs, les sessions, l'historique des chats et les données des prestataires.

---

## 🏗️ Architecture du Projet

```bash
ChatAndGo/
├── app/
│   ├── (auth)/               # Écrans publics (Login, OTP, Setup Profil)
│   ├── (tabs)/               # Écrans protégés (Accueil, Chat, Historique, Profil)
│   └── _layout.jsx           # Routeur principal (gestion de l'accès)
├── components/
│   ├── chat/                 # Composants du Chat (Bulles, TypingIndicator, Cartes Prestataires)
│   ├── layout/               # Wrappers d'écran
│   └── ui/                   # Boutons et Inputs réutilisables
├── constants/
│   ├── Colors.js             # Design System (Couleurs)
│   └── Styles.js             # Styles globaux
├── services/
│   ├── authService.js        # Appels API pour l'authentification (n8n)
│   └── chatService.js        # Appels API pour l'assistant IA (n8n)
├── store/
│   └── useUserStore.js       # Store Zustand (Données de l'utilisateur connecté)
└── assets/                   # Images, icônes, polices
```

---

## 🚀 Installation & Démarrage

### Prérequis
- [Node.js](https://nodejs.org/) installé sur votre machine.
- L'application **Expo Go** installée sur votre smartphone (iOS ou Android).
- Un compte [Expo](https://expo.dev/) (Optionnel mais recommandé pour les builds).

### Étapes d'installation

1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/Darel225/ChatandGo.git
   cd ChatAndGo
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Lancer le serveur de développement :**
   ```bash
   npx expo start
   ```

4. **Tester sur votre appareil :**
   - Scannez le QR code affiché dans le terminal avec l'appareil photo de votre iPhone (iOS) ou avec l'application Expo Go (Android).

---

## 🔌 API & Webhooks (n8n)

L'application communique exclusivement avec des webhooks n8n. Voici la liste des points de terminaison utilisés :

| Fonctionnalité | Endpoint | Payload |
| --- | --- | --- |
| Demande OTP | `/webhook/auth-request-otp` | `{ email }` |
| Vérification OTP | `/webhook/auth-verify-otp` | `{ email, code }` |
| Maj Profil | `/webhook/auth-update-profile`| `{ email, nom, prenom, quartier, avatar }` |
| Envoi Message IA | `/webhook/convcommerce` | `{ message, sessionId }` |
| Historique | `/webhook/get-history` | `{ email }` |
| Charger un Chat | `/webhook/get-conversation` | `{ sessionId }` |
| Vider Historique| `/webhook/clear-history` | `{ email }` |

---

## 📦 Génération de l'APK (Android)

Pour générer un fichier `.apk` installable :

1. Assurez-vous d'avoir `eas-cli` installé :
   ```bash
   npm install -g eas-cli
   ```
2. Connectez-vous à votre compte Expo :
   ```bash
   eas login
   ```
3. Lancez la compilation :
   ```bash
   eas build -p android --profile preview
   ```

---

## 📄 Licence
Ce projet est privé et développé dans le cadre de la solution ChatAndGo.

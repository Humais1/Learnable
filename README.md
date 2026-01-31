# LearnAble – Inclusive Learning for Every Child

Mobile app for visually impaired children (letters, numbers, birds, animals) with parent dashboard and voice-first UX.

## Tech stack

- **Frontend:** React Native (Expo), TypeScript
- **Backend / Auth / DB:** Firebase (Auth, Realtime Database)
- **APIs:** Google Speech-to-Text, Text-to-Speech, Dialogflow (planned)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Firebase**

   - Create a project at [Firebase Console](https://console.firebase.google.com).
   - Enable **Authentication → Sign-in method → Email/Password**.
   - Copy the web app config (apiKey, authDomain, projectId, etc.).

3. **Environment**

   - Copy `.env.example` to `.env`.
   - Fill in the Firebase values with the `EXPO_PUBLIC_` prefix (see `.env.example`).

4. **Run**

   **Web (localhost)**

   ```bash
   npm run web
   ```
   Opens the app in your browser at `http://localhost:8081` (or the port shown in the terminal).

   **Expo Go (phone)**

   - Start Metro: `npm start`
   - On your phone (same Wi‑Fi): install **Expo Go**, then scan the QR code.
   - Different network: `npm run start:tunnel`, then scan the QR code.

## Testing auth (Phase 2)

- **Register:** Open app → after splash, tap “Create an account” → enter name, email, password → Create account.
- **Logout:** Parent tab → “Log out”.
- **Login:** Sign in with the same email/password.
- **Session:** Close and reopen the app; you should stay logged in (Firebase persists the session).
- **Reset password:** On Login, tap “Forgot password?” → enter email → Send reset link.

## Project structure

- `src/config/` – Firebase config
- `src/contexts/` – Auth (and later Child) context
- `src/hooks/` – useTTS, useScreenAnnounce
- `src/navigation/` – Root, Auth, Main, Parent, Child navigators
- `src/screens/` – auth, parent, child screens
- `src/theme/` – colors, typography, spacing

## Tests

```bash
npm test
```

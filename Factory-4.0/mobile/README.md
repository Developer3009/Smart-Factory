FAS Mobile (Expo) - Quick start

This is a minimal React Native (Expo) prototype that demonstrates face capture and login/register calls to the backend.

Prerequisites
- Node.js (18+ recommended)
- npm or yarn
- expo CLI (optional): npm install -g expo-cli
- Backend running locally at http://localhost:8000 (or adjust BASE_URL in App.js)

Install and run
1. cd mobile
2. npm install
3. npm start

Open the app
- Use Expo Go on a phone (scan the QR code shown) or run on emulator with "npm run android" / "npm run ios".

Notes
- For the Android emulator, use the host '10.0.2.2' instead of 'localhost' if needed. For physical devices, use the machine's LAN IP or Expo tunnel.
- For a real product, replace the simple perceptual-hash flow with a secure face-recognition backend, add TLS, and secure user onboarding.

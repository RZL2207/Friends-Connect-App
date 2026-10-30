# Friends-Connect-App 🚀

A comprehensive, multi-platform social discovery, event ticketing, and celebrity connection ecosystem featuring:
- **Real-Time 1-on-1 Audio Matchmaking**: Random social discovery with online users using WebSockets and WebRTC.
- **VIP Celebrity Connect**: Pay-per-minute audio and video calling with verified celebrity creators.
- **Location-Based Event Discovery & QR Ticketing**: Post events with GPS coordinates, discover local events, and scan QR tickets at the venue.
- **Multi-Tenant Customer Support**: Direct in-app voice calls and live chat support for users, organizers, and celebrities.
- **Super Admin Governance**: Deep control to moderate users, approve KYC, and view platform metrics.

---

## 📱 Platforms Included

1. **Backend & Real-time Signaling Engine (`backend/`)**
   - Node.js, Express, TypeScript, Socket.io, JWT authentication
   - In-memory data store with geo-proximity calculation (Haversine formula)
   - Real-time matchmaking queue and WebRTC signaling

2. **Unified Web Portal (`web/`)**
   - Single-page portal with dynamic Role-Based Access Control (RBAC)
   - Mobile OTP authentication & 1-Click test logins
   - Audio matchmaking simulator, Event ticketing, Organizer scanner, Support console, and Admin dashboard

3. **Android Native Application (`android/`)**
   - Kotlin, Jetpack Compose, Material 3, Coroutines, StateFlow
   - Retrofit API integration & Socket.io client
   - TelecomManager & audio call controls (Mute, Speaker, Next match)

4. **iOS Native Application (`ios/`)**
   - Swift, SwiftUI, Combine, Async/Await
   - Apple **CallKit** (`CXProvider`) integration for native incoming & outgoing call UI
   - Real-time WebSocket matchmaking

---

## 🛠️ Getting Started

### 1. Run the Backend & Web App
```bash
cd backend
npm install
npm run build
npm start
```
The server will run on `http://localhost:4000`. Opening this URL in your browser gives you the complete Web Portal with the interactive Login screen.

### 2. Run Android App
Open the `android/` directory in **Android Studio**. Gradle will sync dependencies and you can run it directly on an emulator or Android device.

### 3. Run iOS App
Open the `ios/` directory in **Xcode** and run on the iOS Simulator or an iPhone.

---

## 📄 License
MIT License

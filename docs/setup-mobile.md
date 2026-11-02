# Biz499 Customer Mobile Application Setup Guide

The Biz499 Mobile Application is built with **React Native 0.76.7**, **Expo 52**, **TypeScript**, **Expo Router 4**, and **TanStack Query**. It targets both **Android** and **iOS** mobile platforms.

---

## 1. Prerequisites

- **Node.js**: v18.0.0+ (v20+ recommended)
- **Expo CLI**: bundled with `npx expo`
- **For Android Development**: Android Studio with Android SDK (API 34+), Android Virtual Device (AVD), or a physical Android phone running Expo Go.
- **For iOS Development** (macOS only): Xcode 15+, iOS Simulator, or a physical iPhone running Expo Go.
- **For Cloud Builds**: EAS CLI (`npm install -g eas-cli`) and an Expo Application Services account.

---

## 2. Directory Structure

```text
mobile/
├── app/                     # File-based navigation (Expo Router 4)
│   ├── _layout.tsx          # Root Stack provider (QueryClient, AuthProvider)
│   ├── onboarding.tsx       # First-launch onboarding slides
│   ├── checkout.tsx         # Order confirmation & sandbox payment flow
│   ├── enquiry.tsx          # Lead capture & custom requirements
│   ├── consultation.tsx     # 1-on-1 strategy call booking
│   ├── notifications.tsx    # Customer notification center
│   ├── (auth)/              # Authentication screens
│   │   ├── login.tsx        # Client login with 1-click demo button
│   │   └── register.tsx     # Registration with referral code & GSTIN
│   ├── (tabs)/              # Persistent bottom tab navigation
│   │   ├── _layout.tsx      # Tab bar icons & badges
│   │   ├── index.tsx        # Home screen (Hero ₹499 CTA, packages, testimonials)
│   │   ├── services.tsx     # Catalog explorer & category filtering
│   │   ├── projects.tsx     # Active client projects & milestone statuses
│   │   ├── orders.tsx       # Order history & invoice receipts download
│   │   └── profile.tsx      # Business profile, referral code, privacy preferences
│   ├── service/
│   │   └── [slug].tsx       # Service details and package tier comparison
│   ├── package/
│   │   └── [slug].tsx       # Package customization with add-ons & live estimate
│   ├── project/
│   │   └── [id].tsx         # Project portal (milestones, revisions, approvals)
│   └── support/
│       ├── index.tsx        # Support tickets listing
│       ├── new.tsx          # Ticket creation form
│       └── [id].tsx         # Threaded helpdesk conversation
├── assets/                  # Brand assets (icon.png, splash-icon.png, adaptive-icon.png)
├── src/
│   ├── components/          # Reusable UI component library (Card, Button, Badge, etc.)
│   ├── context/             # AuthContext with SecureStore token persistence
│   ├── lib/                 # Typed API client with automatic token refresh
│   └── theme/               # Color palette, spacing, typography, radii
├── app.json                 # Expo project configuration
├── eas.json                 # EAS build profiles (Preview APK, iOS Ad-hoc, Production)
├── package.json
└── tsconfig.json
```

---

## 3. Environment Configuration

By default, the mobile app uses the following API host endpoints configured in `mobile/src/lib/api.ts`:

- **Android Emulator**: `http://10.0.2.2:8000/api/v1` (routes to localhost on the host PC)
- **iOS Simulator / Physical Device**: `http://localhost:8000/api/v1` or your computer's local Wi-Fi IP (e.g. `http://192.168.1.50:8000/api/v1`)
- **Production**: Configurable via `EXPO_PUBLIC_API_URL` environment variable.

To specify a custom backend IP for physical device testing, create `.env` in `mobile/`:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.50:8000/api/v1
```

---

## 4. Running Locally

### Step 1: Install Dependencies

```bash
cd mobile
npm install
```

### Step 2: Validate TypeScript Types

```bash
npm run typecheck
```

*(Ensures strict TypeScript compilation with zero type errors).*

### Step 3: Start the Metro Bundler

```bash
npx expo start
```

From the interactive CLI prompt:
- Press `a` to open in an **Android Emulator**
- Press `i` to open in an **iOS Simulator**
- Scan the printed QR code with **Expo Go** on your physical phone (ensure your phone is connected to the same Wi-Fi network as your development computer).

---

## 5. Client Demo Sign-In

To test the signed-in customer experience without manual typing:
1. Tap the **Profile** tab or attempt to view **My Projects**.
2. Tap **Sign In**.
3. Tap the **"1-Click Demo Client"** button.
   - Signs in as `demo.client@example.com`
   - Automatically loads pre-seeded projects, milestones, invoice receipts, and referral code.

---

## 6. Building Standalone Apps with EAS Build

The `mobile/eas.json` file contains pre-configured profiles for Android and iOS builds.

### Log in to EAS

```bash
npx eas-cli login
npx eas-cli project:init
```

### Build Android APK (For direct test installation on physical devices)

```bash
npx eas-cli build --platform android --profile preview
```

### Build Android AAB (For Google Play Store submission)

```bash
npx eas-cli build --platform android --profile production
```

### Build iOS Simulator Build (For testing on Mac without Apple Developer account)

```bash
npx eas-cli build --platform ios --profile preview
```

### Build iOS Archive (For Apple App Store / TestFlight submission)

```bash
npx eas-cli build --platform ios --profile production
```


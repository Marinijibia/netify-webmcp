# Netify Mobile Application

**AI Collections + Business Memory for African SMEs.**

Netify Mobile is an independent, standalone cross-platform mobile application built with React Native and Expo. It delivers collection workflows, automated debtor prioritization, WhatsApp follow-ups, and business intelligence on mobile devices.

---

## 🏗 Architecture & Stack

- **Framework**: Expo SDK 54 (`~54.0.37`) / React Native `0.81.5`
- **Routing**: Expo Router (`~6.0.24`) with typed routes and route groups
- **Styling**: NativeWind v5 + Tailwind CSS v4 + React Native CSS
- **Server State**: TanStack Query v5
- **Client State**: Zustand
- **Forms & Validation**: React Hook Form + Zod
- **Secure Storage**: `expo-secure-store`
- **Type Safety**: TypeScript 5.9 (Strict mode enabled)

---

## 📁 Project Structure

```
Netify/
├── app/                      # Expo Router File-Based Routing
│   ├── _layout.tsx           # Global providers (QueryClient, SafeAreaProvider, Auth)
│   ├── index.tsx             # Root router entry redirect
│   ├── (auth)/               # Authentication route group
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── verify-email.tsx
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   ├── (onboarding)/         # Business onboarding route group
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   └── (app)/                # Authenticated main application group
│       ├── _layout.tsx
│       └── index.tsx
├── assets/                   # App icons and splash screen
│   └── images/
├── src/                      # Source Code
│   ├── components/           # UI and Feedback Primitives
│   │   ├── feedback/         # Loading, Empty, Error states
│   │   └── ui/               # Button, Input, Card, Text primitives
│   ├── config/               # Validated environment configuration (Zod)
│   │   └── env.ts
│   ├── constants/            # Theme tokens & design system constants
│   │   └── theme.ts
│   ├── lib/                  # TanStack Query & Utility helpers
│   │   ├── query-client.ts
│   │   └── utils.ts
│   ├── services/             # HTTP API Client & Secure Storage
│   │   ├── api/              # Typed ApiClient, domain errors, response types
│   │   └── storage/          # SecureStorageService (expo-secure-store)
│   └── store/                # Zustand stores (auth-store, ui-store)
├── .env.example              # Environment variables template
├── app.json                  # Expo application manifest
├── eas.json                  # EAS Build configuration (dev, preview, prod)
├── metro.config.js           # Metro bundler wrapped with NativeWind
├── postcss.config.mjs        # PostCSS configuration for Tailwind
├── tailwind.config.js        # Tailwind CSS theme configuration
└── tsconfig.json             # Strict TypeScript configuration with @/* aliases
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: >= 18.0.0
- **Package Manager**: `npm`
- **Expo Go App**: Version compatible with SDK 54 (iOS / Android)

### Installation

```bash
cd Netify
npm install --legacy-peer-deps
```

### Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure your local backend endpoint:
```ini
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_APP_ENV=development
```

---

## 📱 Running the Application

### Start Expo Development Server

```bash
npx expo start
```

### Direct Platform Launchers

- **Android (Emulator / Device)**: `npx expo start --android`
- **iOS (Simulator / Device)**: `npx expo start --ios`
- **Web**: `npx expo start --web`

---

## 🔍 Quality Assurance & Diagnostics

- **TypeScript Typecheck**:
  ```bash
  npx tsc --noEmit
  ```

- **Expo Diagnostics**:
  ```bash
  npx expo-doctor
  ```

---

## 📦 Cloud Builds with EAS

- **Development Build**:
  ```bash
  npx eas-cli build --profile development --platform android
  ```

- **Preview APK / TestFlight**:
  ```bash
  npx eas-cli build --profile preview --platform android
  ```

- **Production App Store / Google Play**:
  ```bash
  npx eas-cli build --profile production --platform all
  ```

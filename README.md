# BeejRakshak

BeejRakshak is an offline-first seed and fertilizer verification app for Indian farmers and inspectors. It is built with React, Vite, TypeScript and Capacitor for Android.

## App features

- QR scanning and manual package photo capture/upload.
- Local seed and fertilizer batch registry backed by IndexedDB.
- Offline verification fallback when there is no network connection.
- Online package inspection through a separately deployed Gemini-powered API.
- Inspector alerts with offline queuing and later synchronization.
- Regional language interface and voice verdict support.
- Field guide and regional registry views.

## Interface overview

The UI uses a clean agricultural visual style: a pale sage background, deep green navigation and actions, white rounded cards, and restrained yellow accents in the brand mark. On desktop, the header contains the BeejRakshak wordmark and four navigation tabs. On phones, navigation moves to a fixed four-item bottom bar. The main workspace is designed around verification, with separate registry, inspector alerts and field-guide sections.

## Run the web app

Requirements: Node.js 22 or newer.

```bash
npm install --legacy-peer-deps
npm run dev
```

Open the local URL printed by Vite. The Express API development server is available separately through `npm run dev:server` (see scripts in `package.json`).

## Build the Android APK

See [ANDROID_BUILD_WINDOWS.md](./ANDROID_BUILD_WINDOWS.md) for Windows and GitHub Actions instructions.

The GitHub Actions workflow builds a debug APK automatically when code is pushed to `main`/`master`, or when manually started from the Actions tab.

## Environment variables

Copy `.env.example` to `.env` only for local backend development. Keep secrets out of Git.

- `GEMINI_API_KEY`: server-side key for online AI package inspection.
- `VITE_API_BASE_URL`: public base URL of a deployed API when the Android app needs to call it.

Offline registry and heuristic verification can run without these values. AI cloud inspection requires a deployed backend; building the APK does not deploy the backend.

## Project structure

```text
src/                 React app and UI
src/components/      Verification, registry, alert and guide screens
src/lib/             Offline database, verification and API helpers
public/              App icons and PWA assets
android/             Capacitor Android project
.github/workflows/   GitHub Actions APK build
server.ts            Express API server
vite.config.ts       Vite, React, Tailwind and PWA configuration
```

## Important

A successful APK build verifies compilation and packaging; it does not independently validate real-world seed authenticity. Registry records and verification outcomes should be checked against official agricultural department data before field deployment. A debug APK is not a signed Play Store release.

# Build BeejRakshak on Windows

## Recommended: build from GitHub Actions

This avoids installing Node.js, Gradle, or the Android SDK on your PC.

1. Create a GitHub repository and upload the complete contents of this folder.
2. Open the repository's **Actions** tab.
3. Select **Build BeejRakshak Android APK**.
4. Click **Run workflow** and confirm **Run workflow**.
5. Wait for the workflow to finish successfully.
6. Open the completed run and download the `BeejRakshak-debug-apk` artifact.
7. Extract the downloaded artifact. It contains `app-debug.apk`.

The workflow installs Node.js, Java, Android SDK packages and Gradle in the GitHub runner, then builds the web assets, syncs Capacitor and compiles the Android APK.

## Build locally in Android Studio

Prerequisites: Node.js 22, Android Studio with Android SDK 35, and JDK 21.

From this project directory in Command Prompt:

```bat
npm install --legacy-peer-deps
npm run build
npx cap sync android
```

Then open the `android` folder in Android Studio, wait for Gradle sync, and select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

If Android Studio reports that the Gradle wrapper is missing, install Gradle 8.11.1 and run this from the project directory:

```bat
cd android
gradle wrapper --gradle-version 8.11.1
gradle assembleDebug
```

APK output:

```text
android\app\build\outputs\apk\debug\app-debug.apk
```

## Notes

- A debug APK is for testing, not a Play Store release.
- The offline registry and local verification flow do not require a Gemini API key.
- Cloud AI inspection requires a separately deployed API backend with a valid server-side `GEMINI_API_KEY`. Do not put a private API key in frontend source code or commit `.env` files.
- The Android app requires camera permission for scanning. Location is used by inspector reporting features when enabled.

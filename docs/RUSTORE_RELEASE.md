# RuStore release build

LocalMind Android package: `ai.localmind.app`  
Version: `1.24.2` (version code `164`)  
Minimum Android: 7.0 / API 24  
Native ABI in the current build: ARM64 (`arm64-v8a`).

## 1. Create your own release key

In Android Studio use **Build → Generate Signed Bundle / APK**, or run:

```bash
keytool -genkeypair -v -keystore localmind-release-key.keystore -alias localmind -keyalg RSA -keysize 2048 -validity 10000
```

Keep the keystore and its passwords private. Do not commit them to GitHub.

## 2. Configure signing

Put the keystore in `android/app/` and add these values to the ignored project-root `.env` file:

```dotenv
APP_RELEASE_STORE_FILE=localmind-release-key.keystore
APP_RELEASE_STORE_PASSWORD=YOUR_STORE_PASSWORD
APP_RELEASE_KEY_ALIAS=localmind
APP_RELEASE_KEY_PASSWORD=YOUR_KEY_PASSWORD
```

The release Gradle task now stops with an explicit error if these values or the keystore are missing. It will not silently create a debug-signed store build.

## 3. Build

From the project root:

```bash
cd android
./gradlew bundleProdRelease
```

The AAB is created at:

`android/app/build/outputs/bundle/prodRelease/app-prod-release.aab`

To create an APK instead, run `./gradlew assembleProdRelease`.

The first Android build downloads the small Russian and English Tesseract OCR data files and bundles them into the app. OCR then works offline. The chat model is downloaded separately during onboarding.

**Compatibility note:** this source currently builds ARM64 only. It targets Android 7.0 and newer, but 32-bit-only phones are not supported by this APK.

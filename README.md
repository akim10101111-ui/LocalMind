# LocalMind

**Private AI on your device.** LocalMind is an Android and iOS application for running open language models locally, managing model downloads, and keeping chats on the device by default.

## Features

- Run compatible GGUF language models with the on-device llama.cpp engine.
- Download and manage models from Hugging Face or import compatible model files.
- Keep local chat history, edit prompts, regenerate answers, and export conversations.
- Use optional on-device speech recognition and text-to-speech.
- Analyse images on supported devices and models.
- Use built-in tools such as calculations, date/time, HTML rendering, and optional web search.
- Benchmark model speed and memory on the current device.
- Expose the loaded local model through an optional, key-protected HTTP API server.
- Switch between light/dark themes and supported interface languages.

Assistant presets are optional, local-only chat profiles. Local models, history, and inference stay on the device unless you explicitly configure an online service.

## Privacy and connectivity

Local chat inference and saved conversations are handled on the device. Internet access is used when the user chooses features that need it, such as model downloads, Hugging Face search, configured web search, or a remote model endpoint. The optional local API server listens only on the configured interfaces and should be protected with an API key before enabling LAN access.

## Build from source

### Requirements

- Node.js version specified by `.nvmrc` (the package requires Node.js `>=22.21.0`).
- Yarn Classic (`1.22.x`).
- Android Studio with the Android SDK/NDK for Android builds.
- Xcode and CocoaPods on macOS for iOS builds.

### Install and run

```bash
nvm use
yarn install

# Start Metro
yarn start

# Android
yarn android

# iOS (macOS only)
cd ios && pod install && cd ..
yarn ios
```

### Quality checks

```bash
yarn lint
yarn typecheck
yarn test
yarn l10n:validate
```

### Android APK

```bash
cd android
./gradlew --no-daemon --build-cache assembleProdDebug
```

The production-debug variant is suitable for local device testing. A distributable store release must be signed with your own release keystore and verified before publication.

## Project layout

```text
src/
├── api/          Completion engines and local API server
├── components/   Chat, model, voice, settings, and shared UI
├── database/     Local persistence and migrations
├── hooks/        Chat, navigation, voice, and device hooks
├── locales/      Interface translations
├── repositories/ Persistence access layer
├── screens/      Chat, Models, Benchmark, Settings, App Info
├── services/     Agent tools, downloads, model/device rules, ASR, TTS
├── store/        Observable application state
└── utils/        Model, chat, export, memory, and platform helpers
```

## Licence

See [LICENSE](LICENSE) for the licence included with this source archive.

# LocalMind — source migration notes

This archive is the cleaned and rebranded source snapshot prepared from the ZIP attached in the current conversation.

## Product changes

- Rebranded the visible application to **LocalMind**: app label, onboarding/empty states, About content, app icons, launch mark, and logo assets.
- Replaced the left drawer with a compact LocalMind header, a prominent New Chat action, Chat and Models navigation, grouped tools, and retained chat history actions.
- Removed the Pals/PalsHub marketplace screen and services, PocketPal Plus screen/host/gating, in-app purchase services, purchase settings, account-link UI, and old purchase-only tests/fixtures.
- Removed obsolete store/auth dependencies, pruned 16 unreachable Yarn lockfile entries, and removed the matching unused iOS purchase / social-sign-in pods from `ios/Podfile.lock`. Removed the inherited Weblate automation and unused purchase/account-deletion test fixtures that still targeted the retired PocketPal/PalsHub services; the existing local translations remain bundled and validated.
- Removed the old screenshots/marketing-image directory that belonged to the retired product presentation.
- Updated the onboarding model tiers to use the current curated LFM2.5 1.2B, Qwen3.5 2B, and Qwen3.5 4B GGUF choices.

## Features intentionally retained

- Local GGUF model discovery/download/import and on-device inference.
- Chat history, session management, export, editing, and regeneration.
- Local assistant profiles, system prompts, per-assistant model choices, and their existing database records. These are local chat profiles, not the removed marketplace. The measured per-device compatibility tables remain available; they are not blanket-deleted because they include device-tested choices. Older GGUF families may still be imported manually where supported, while onboarding defaults now use the refreshed model tiers.
- Voice input/output, vision where supported, tools, benchmark, and the optional local HTTP API server.
- The current database schema and migration history. Legacy marketplace ID fields remain inert compatibility metadata so existing local assistant records and exports are not damaged. No active marketplace client remains. The uploaded ZIP did not include a separate external user-review export or issue list, so no user feedback is invented or attributed to real customers.

## Compatibility identifiers intentionally retained

The visible product name is LocalMind, but the following internal identifiers remain unchanged to avoid breaking installed users, stored data, native signing, and existing shortcuts/deep links:

- Android application ID: `com.pocketpalai`
- iOS bundle identifier: `ai.pocketpal`
- Local database name: `pocketpalai`
- Existing `pocketpal://` URL scheme and native project/workspace names
- Native speech bridge package names supplied by the existing upstream dependency

Changing these identifiers is a separate migration: it creates a new app identity and may prevent the existing app from upgrading in place or reading its previous database/keychain data.

## Validation performed

- `node scripts/validate-l10n.js` — passed; all locale JSON files are valid.
- `node scripts/verify-fonts.js` — passed; all bundled font families are present for both platforms.
- TypeScript parser sweep — 1,335 JS/TS/TSX files, 0 parser errors, 0 missing relative imports.
- XML/plist/storyboard/SVG sweep — 172 files parsed successfully.
- Logo assets — transparent PNG alpha channel, SVG source, Android adaptive foreground and iOS app icon dimensions checked.
- Legacy purchase/marketplace imports and Pals/Plus navigation routes — none remain in active source imports/navigation.

## Build status and environment requirements

A full Jest run, TypeScript typecheck, Android APK build, and iOS archive were **not** completed in this environment. The supplied source requires Node.js `22.21.0` or later and Yarn Classic `1.22.22`; this environment has Node.js `22.16.0`, Yarn is not installed, and the package registry could not be reached. No Android SDK/ADB or Xcode toolchain is configured here.

On a build machine, install the version in `.nvmrc`, enable Yarn Classic `1.22.22`, install dependencies with `yarn install --frozen-lockfile`, then run `yarn lint`, `yarn typecheck`, `yarn test`, and `cd android && ./gradlew --no-daemon --build-cache assembleProdDebug`.

This archive is a source-code handoff, not a claimed verified APK.

# Contributing to LocalMind

Thanks for helping improve LocalMind. Bug reports, small fixes, performance work, and documentation are welcome.

## Development setup

Use the versions pinned by the project:

- Node.js: `.nvmrc` (22.21.0)
- Yarn Classic: 1.22.22
- Android Studio + Android SDK/NDK for Android builds
- Xcode + CocoaPods for iOS builds

Install dependencies with `yarn install`, then run `yarn start` and either `yarn android` or `yarn ios`.

## Quality checks

Run the relevant checks before opening a pull request:

```bash
yarn lint
yarn typecheck
yarn test
yarn l10n:validate
```

For Android, use `yarn build:android`. For iOS, use `yarn ios:build` on a Mac with Xcode configured.

## Changes and pull requests

Keep each change focused. Add or update tests for bug fixes, preserve existing user data, and include screenshots for user-visible changes. Do not commit signing keys, API secrets, Firebase configuration, or personal data.

Use Conventional Commits, for example:

- `fix: prevent model download corruption`
- `perf: reduce chat rerenders`
- `chore: remove obsolete navigation code`

## Localization

English strings in `src/locales/en.json` are the source of truth. Preserve interpolation placeholders exactly and run `yarn l10n:validate` after changing strings.

## License

LocalMind is distributed under the MIT License. By contributing, you agree that your contribution may be distributed under that license.

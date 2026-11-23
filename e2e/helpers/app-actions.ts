import path from 'path';

const appId = () => process.env.APP_ID || 'com.pocketpalai';

// The release workflow may provide an already-built APK path. Reinstalling is
// intentionally kept separate from the removed in-app-purchase test helpers.
export async function reinstallApp(): Promise<void> {
  const appPath = process.env.APK_PATH;
  if (!appPath) {
    throw new Error('APK_PATH must be set to reinstall the app');
  }
  await browser.removeApp(appId());
  await browser.installApp(path.resolve(appPath));
  await browser.activateApp(appId());
}

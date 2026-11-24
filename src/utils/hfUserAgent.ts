import DeviceInfo from 'react-native-device-info';

/**
 * User-Agent for outbound Hugging Face requests (API + model downloads).
 * The application identifier is stable across supported platforms.
 */
export const hfUserAgent = (): string =>
  `LocalMind/${DeviceInfo.getVersion()} (compatible; local inference app)`;

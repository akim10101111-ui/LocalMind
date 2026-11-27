import {NativeModules, Platform} from 'react-native';

interface LocalMindOcrNative {
  recognizeImage(uri: string): Promise<string>;
  recognizePdf(uri: string): Promise<string>;
}

const nativeOcr = NativeModules.LocalMindOcr as LocalMindOcrNative | undefined;

const requireAndroidOcr = (): LocalMindOcrNative => {
  if (Platform.OS !== 'android' || !nativeOcr) {
    throw new Error('Offline OCR is available in the Android build only.');
  }
  return nativeOcr;
};

/** Extract Russian/English text from a local image without sending it to a server. */
export const extractTextFromImage = (uri: string): Promise<string> =>
  requireAndroidOcr().recognizeImage(uri);

/** OCR the first 20 pages of a local PDF, one page at a time to limit memory use. */
export const extractTextFromPdf = (uri: string): Promise<string> =>
  requireAndroidOcr().recognizePdf(uri);

import {FIREBASE_FUNCTIONS_URL} from '@env';

export const HF_DOMAIN = 'https://huggingface.co';
export const HF_API_BASE = `${HF_DOMAIN}/api/models`;

export const APPLE_MEDIA_TERMS_URL =
  'https://www.apple.com/legal/internet-services/itunes/us/terms.html';

const firebaseFunctionsBase = FIREBASE_FUNCTIONS_URL?.trim().replace(/\/+$/, '');

const requireFirebaseFunctionsBase = (): string => {
  if (!firebaseFunctionsBase) {
    throw new Error(
      'Remote reporting is not configured for this LocalMind build.',
    );
  }
  return firebaseFunctionsBase;
};

export const urls = {
  // API URLs
  modelsList: () => `${HF_API_BASE}`,
  modelTree: (modelId: string) => `${HF_API_BASE}/${modelId}/tree/main`,
  modelSpecs: (modelId: string) => `${HF_API_BASE}/${modelId}`,

  // Web URLs
  modelDownloadFile: (modelId: string, filename: string) =>
    `${HF_DOMAIN}/${modelId}/resolve/main/${filename}`,
  modelWebPage: (modelId: string) => `${HF_DOMAIN}/${modelId}`,

  // Benchmark Endpoint
  benchmarkSubmit: () => `${requireFirebaseFunctionsBase()}/api/v1/submit`,

  // Feedback Endpoint
  feedbackSubmit: () => `${requireFirebaseFunctionsBase()}/feedback`,
};

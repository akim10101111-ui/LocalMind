/**
 * The single model LocalMind downloads, verifies and runs.
 *
 * Verified on Hugging Face: bartowski/DeepSeek-R1-Distill-Qwen-1.5B-GGUF
 * contains DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf (about 1.12 GB).
 * The exact byte size and SHA-256 are NOT hardcoded here: they are read from
 * the Hugging Face file metadata (lfs.size / lfs.oid) at install time, so the
 * check always matches the file that is actually published.
 */
import type {OnboardingPalModelEntry} from '../store/onboarding/onboardingPals';

export const LOCALMIND_MODEL_REPO =
  'bartowski/DeepSeek-R1-Distill-Qwen-1.5B-GGUF';
export const LOCALMIND_MODEL_FILENAME =
  'DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf';

/** Matches `Model.id` for an HF-sourced model: `${repo}/${filename}`. */
export const LOCALMIND_MODEL_ID = `${LOCALMIND_MODEL_REPO}/${LOCALMIND_MODEL_FILENAME}`;

/**
 * Size is only used for the pre-download free-space check, so it is an
 * upper-bound estimate (1.12 GB listed on Hugging Face, plus headroom).
 */
export const LOCALMIND_MODEL_ENTRY: OnboardingPalModelEntry = {
  tier: 'balanced',
  recommended: true,
  repo: LOCALMIND_MODEL_REPO,
  filename: LOCALMIND_MODEL_FILENAME,
  author: 'bartowski',
  downloadUrl: `https://huggingface.co/${LOCALMIND_MODEL_REPO}/resolve/main/${LOCALMIND_MODEL_FILENAME}`,
  displayName: 'LocalMind 1.5B',
  sizeBytes: 1_200_000_000,
  params: 1_500_000_000,
};

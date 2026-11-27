/**
 * Install, verification and readiness state for the single LocalMind model.
 *
 * Install runs as a single-flight background operation: it is owned by this
 * module, not by any screen, so leaving the onboarding screen (Skip) or
 * restarting the app does not cancel it, and it never starts twice.
 *
 * Reuses the existing ModelStore download pipeline (space check, resumable
 * download, GGUF magic check) and adds the integrity check: file size and
 * SHA-256 against Hugging Face's published metadata.
 */
import {makeAutoObservable, runInAction} from 'mobx';
import * as RNFS from '@dr.pogodin/react-native-fs';

import {modelStore, palStore} from '../store';
import {resolvePalForTopic} from '../store/onboarding/onboardingPals';
import {
  LOCALMIND_MODEL_ENTRY,
  LOCALMIND_MODEL_ID,
  LOCALMIND_MODEL_REPO,
} from '../config/localMindModel';
import type {Model} from '../utils/types';

/** Error codes; the UI maps them to localized copy. */
export const LOCALMIND_ERROR = {
  registerFailed: 'LOCALMIND_REGISTER_FAILED',
  downloadInterrupted: 'LOCALMIND_DOWNLOAD_INTERRUPTED',
  metadataUnavailable: 'LOCALMIND_VERIFY_METADATA_UNAVAILABLE',
  sizeMismatch: 'LOCALMIND_VERIFY_SIZE_MISMATCH',
  hashMismatch: 'LOCALMIND_VERIFY_HASH_MISMATCH',
} as const;

/** Give ModelStore this long to register the download job before giving up. */
const JOB_START_GRACE_MS = 5000;
const POLL_INTERVAL_MS = 500;
const LEGACY_LOCALMIND_MODEL_ID = `${LOCALMIND_MODEL_REPO}/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf`;

export type LocalMindInstallPhase =
  | 'idle'
  | 'downloading'
  | 'verifying'
  | 'starting'
  | 'ready'
  | 'failed';

class LocalMindInstallState {
  phase: LocalMindInstallPhase = 'idle';
  bytesDone = 0;
  bytesTotal = 0;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get isInstalling(): boolean {
    return (
      this.phase === 'downloading' ||
      this.phase === 'verifying' ||
      this.phase === 'starting'
    );
  }

  get percent(): number {
    return this.bytesTotal > 0
      ? Math.min(100, Math.round((this.bytesDone / this.bytesTotal) * 100))
      : 0;
  }
}

/** Observed by the chat input and the setup screen. */
export const localMindInstallState = new LocalMindInstallState();

export const findLocalMindModel = (): Model | undefined => {
  const currentQuant = modelStore.models.find(
    m => m.id === LOCALMIND_MODEL_ID,
  );
  // Q4_K_M was shipped by the previous LocalMind APK. Reuse it when present
  // instead of downloading Q4_K_S again just because the quantization changed.
  const previouslyInstalledQuant = modelStore.models.find(
    m => m.id === LEGACY_LOCALMIND_MODEL_ID && m.isDownloaded,
  );
  return currentQuant?.isDownloaded
    ? currentQuant
    : previouslyInstalledQuant ?? currentQuant;
};

/**
 * A downloaded current quant is ready after a successful integrity check
 * (persisted hash). A Q4_K_M file from the prior LocalMind release is reused
 * in place: do not force a second multi-gigabyte download on app update.
 */
export const isLocalMindReady = (): boolean => {
  const model = findLocalMindModel();
  return (
    !!model &&
    model.isDownloaded &&
    (!!model.hash || model.id === LEGACY_LOCALMIND_MODEL_ID)
  );
};

const setPhase = (phase: LocalMindInstallPhase, error: string | null = null) =>
  runInAction(() => {
    localMindInstallState.phase = phase;
    localMindInstallState.error = error;
  });

const setProgress = (done: number, total: number) =>
  runInAction(() => {
    localMindInstallState.bytesDone = done;
    localMindInstallState.bytesTotal = total;
  });

/**
 * Resolves when the file is on disk. Rejects when the download job disappears
 * without producing it (e.g. the app was killed), so the user can resume.
 */
const waitForDownload = (modelId: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (findLocalMindModel()?.isDownloaded) {
        clearInterval(timer);
        resolve();
        return;
      }
      const active = modelStore.activeDownloads.find(
        d => d.modelId === modelId,
      );
      if (active) {
        setProgress(active.bytesDownloaded, active.bytesTotal);
        return;
      }
      if (Date.now() - startedAt > JOB_START_GRACE_MS) {
        clearInterval(timer);
        reject(new Error(LOCALMIND_ERROR.downloadInterrupted));
      }
    }, POLL_INTERVAL_MS);
  });

/**
 * Checks the downloaded file against Hugging Face metadata.
 * On any mismatch the file is removed so the next attempt downloads it again.
 */
export const verifyLocalMindModel = async (model: Model): Promise<void> => {
  // fetchAndUpdateModelFileDetails swallows network errors itself, so the
  // presence of lfs metadata afterwards is the real signal.
  await modelStore.fetchAndUpdateModelFileDetails(model);
  const lfs = model.hfModelFile?.lfs;
  if (!lfs?.oid || !lfs.size) {
    throw new Error(LOCALMIND_ERROR.metadataUnavailable);
  }

  const path = await modelStore.getModelFullPath(model);
  const stat = await RNFS.stat(path);
  if (Number(stat.size) !== lfs.size) {
    await discardCorruptFile(model);
    throw new Error(LOCALMIND_ERROR.sizeMismatch);
  }

  await modelStore.updateModelHash(model.id, true);
  if ((model.hash ?? '').toLowerCase() !== lfs.oid.toLowerCase()) {
    await discardCorruptFile(model);
    throw new Error(LOCALMIND_ERROR.hashMismatch);
  }
};

const discardCorruptFile = async (model: Model): Promise<void> => {
  runInAction(() => {
    model.hash = undefined;
  });
  await modelStore.deleteModel(model).catch(() => {
    // Best effort: the next run re-registers and re-downloads regardless.
  });
};

/** Makes LocalMind the identity and default model of the built-in assistant. */
export const bindLocalMindToAssistant = async (model: Model): Promise<void> => {
  const definition = resolvePalForTopic(null);
  const assistant = palStore.pals.find(
    p => p.source === 'local' && (p.name === definition.name || p.name === 'Pip'),
  );
  if (assistant) {
    await palStore.updatePal(assistant.id, {
      name: definition.name,
      description: definition.description,
      systemPrompt: definition.systemPrompt,
      originalSystemPrompt: definition.systemPrompt,
      isSystemPromptChanged: false,
      defaultModel: model,
    });
  }
};

const activateLocalMind = async (model: Model): Promise<void> => {
  setPhase('starting');
  // A verified file is not a loaded llama context. Restore it after app restart
  // or a model switch instead of treating the file hash as runtime readiness.
  if (modelStore.activeModelId !== model.id || !modelStore.context) {
    await modelStore.selectModel(model);
  }
  if (modelStore.activeModelId !== model.id || !modelStore.context) {
    throw new Error('LocalMind could not load on this device. Check available memory and try again.');
  }
  await bindLocalMindToAssistant(model);
  setPhase('ready');
};

const runInstall = async (): Promise<void> => {
  try {
    const model: Model | undefined =
      findLocalMindModel() ??
      (await modelStore.registerOnboardingPalModel(LOCALMIND_MODEL_ENTRY));
    if (!model) {
      throw new Error(LOCALMIND_ERROR.registerFailed);
    }

    if (!model.isDownloaded) {
      setPhase('downloading');
      // Resumes a partial download; throws on real failures (e.g. no space).
      await modelStore.checkSpaceAndDownload(model.id);
      await waitForDownload(model.id);
    }

    // `hash` is written only after a successful check, so a set hash means
    // this exact file was already verified and needs no second pass.
    // The previous Q4_K_M file was already installed by an older LocalMind
    // release. Keep it in place and do not make an update depend on network
    // metadata just to reuse a valid local model.
    if (!model.hash && model.id !== LEGACY_LOCALMIND_MODEL_ID) {
      setPhase('verifying');
      await verifyLocalMindModel(model);
    }

    await activateLocalMind(model);
  } catch (error) {
    setPhase(
      'failed',
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
};

let inFlight: Promise<void> | null = null;

/**
 * Installs LocalMind, or resumes an interrupted install. Safe to call from
 * anywhere: concurrent callers share one operation, so no second download of
 * the same model is ever started.
 */
export const installLocalMind = (): Promise<void> => {
  if (!inFlight) {
    inFlight = (async () => {
      // isHydrated() only signals AsyncStorage hydration. Wait for
      // initializeStore() so an existing model file isn't mistaken for a
      // missing download during an app update.
      await modelStore.waitForInitialization();

      const existingModel = findLocalMindModel();
      if (
        existingModel?.isDownloaded &&
        (!!existingModel.hash || existingModel.id === LEGACY_LOCALMIND_MODEL_ID)
      ) {
        await activateLocalMind(existingModel);
        return;
      }

      await runInstall();
    })()
      .catch(error => {
        setPhase(
          'failed',
          error instanceof Error ? error.message : String(error),
        );
        throw error;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
};

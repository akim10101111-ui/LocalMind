import {
  findLocalMindModel,
  installLocalMind,
  isLocalMindReady,
} from '../localMindModel';
import {LOCALMIND_MODEL_ID, LOCALMIND_MODEL_REPO} from '../../config/localMindModel';
import {modelStore} from '../../store';

jest.mock('../../store', () => {
  const modelStore = {
    models: [] as any[],
    activeModelId: undefined as string | undefined,
    context: undefined as any,
    activeDownloads: [] as any[],
    waitForInitialization: jest.fn(),
    initializeDownloadStatus: jest.fn(),
    registerOnboardingPalModel: jest.fn(),
    checkSpaceAndDownload: jest.fn(),
    selectModel: jest.fn(),
  };
  const palStore = {
    pals: [] as any[],
    updatePal: jest.fn().mockResolvedValue(undefined),
  };
  return {modelStore, palStore};
});

const store = modelStore as any;
const LEGACY_ID =
  `${LOCALMIND_MODEL_REPO}/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf`;

const downloadedLegacyModel = () => ({
  id: LEGACY_ID,
  isDownloaded: true,
  hash: undefined,
});

describe('LocalMind model upgrade compatibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    store.models = [];
    store.activeModelId = undefined;
    store.context = undefined;
    store.activeDownloads = [];
    store.waitForInitialization.mockResolvedValue(undefined);
    store.initializeDownloadStatus.mockResolvedValue(undefined);
    store.registerOnboardingPalModel.mockResolvedValue(undefined);
    store.checkSpaceAndDownload.mockResolvedValue(undefined);
    store.selectModel.mockImplementation(async (model: any) => {
      store.activeModelId = model.id;
      store.context = {};
    });
  });

  it('prefers an already-downloaded previous quant when the new quant is only a stub', () => {
    const legacy = downloadedLegacyModel();
    const current = {
      id: LOCALMIND_MODEL_ID,
      isDownloaded: false,
      hash: undefined,
    };
    store.models = [current, legacy];

    expect(findLocalMindModel()).toBe(legacy);
    expect(isLocalMindReady()).toBe(true);
  });

  it('prefers the current quant when it is already installed', () => {
    const current = {
      id: LOCALMIND_MODEL_ID,
      isDownloaded: true,
      hash: 'verified',
    };
    const legacy = downloadedLegacyModel();
    store.models = [legacy, current];

    expect(findLocalMindModel()).toBe(current);
    expect(isLocalMindReady()).toBe(true);
  });

  it('waits for persisted models to reconcile before deciding to download', async () => {
    const legacy = downloadedLegacyModel();
    store.waitForInitialization.mockImplementation(async () => {
      store.models = [legacy];
    });

    await installLocalMind();

    expect(store.waitForInitialization).toHaveBeenCalledTimes(1);
    expect(store.initializeDownloadStatus).not.toHaveBeenCalled();
    expect(store.selectModel).toHaveBeenCalledWith(legacy);
    expect(store.registerOnboardingPalModel).not.toHaveBeenCalled();
    expect(store.checkSpaceAndDownload).not.toHaveBeenCalled();
  });
});

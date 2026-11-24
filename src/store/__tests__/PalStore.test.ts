import {palStore} from '../PalStore';
import {palRepository} from '../../repositories/PalRepository';
import type {Pal} from '../../types/pal';

jest.mock('../../repositories/PalRepository', () => ({
  palRepository: {
    checkAndMigrateFromJSON: jest.fn().mockResolvedValue(false),
    getAllPals: jest.fn().mockResolvedValue([]),
    createPal: jest.fn(),
    updatePal: jest.fn(),
    deletePal: jest.fn(),
  },
}));

const localPal = (overrides: Partial<Pal> = {}): Pal => ({
  id: 'local-1',
  type: 'local',
  name: 'Local assistant',
  description: '',
  systemPrompt: 'Be helpful.',
  isSystemPromptChanged: false,
  useAIPrompt: false,
  parameters: {},
  parameterSchema: [],
  capabilities: {},
  source: 'local',
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  ...overrides,
});

describe('PalStore local assistant storage', () => {
  beforeEach(() => {
    palStore.pals = [];
    jest.clearAllMocks();
  });

  it('returns locally stored assistants', () => {
    const assistant = localPal();
    palStore.pals = [assistant];
    expect(palStore.getPals()).toEqual([assistant]);
    expect(palStore.getLocalPals()).toEqual([assistant]);
  });

  it('finds a local assistant by ID', () => {
    const assistant = localPal();
    palStore.pals = [assistant];
    expect(palStore.getPalById(assistant.id)).toEqual(assistant);
    expect(palStore.getPalById('missing')).toBeUndefined();
  });

  it('creates and stores an assistant after persistence succeeds', async () => {
    const assistant = localPal();
    (palRepository.createPal as jest.Mock).mockResolvedValueOnce(assistant);
    const {id: _id, created_at: _createdAt, updated_at: _updatedAt, ...data} = assistant;
    await expect(palStore.createPal(data)).resolves.toEqual(assistant);
    expect(palStore.pals).toContainEqual(assistant);
  });

  it('updates a local assistant in-place after persistence succeeds', async () => {
    const current = localPal();
    const updated = {...current, name: 'Updated assistant'};
    palStore.pals = [current];
    (palRepository.updatePal as jest.Mock).mockResolvedValueOnce(updated);
    await palStore.updatePal(current.id, {name: updated.name});
    expect(palStore.getPalById(current.id)?.name).toBe(updated.name);
  });

  it('deletes a local assistant only after the repository confirms deletion', async () => {
    const assistant = localPal();
    palStore.pals = [assistant];
    (palRepository.deletePal as jest.Mock).mockResolvedValueOnce(true);
    await palStore.deletePal(assistant.id);
    expect(palStore.pals).toHaveLength(0);
  });

  it('filters video-capable assistants without a remote catalogue', () => {
    const video = localPal({id: 'video', capabilities: {video: true}});
    const chat = localPal({id: 'chat', capabilities: {}});
    palStore.pals = [video, chat];
    expect(palStore.getVideoPals()).toEqual([video]);
  });
});

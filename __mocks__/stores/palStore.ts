import type {Pal} from '../../src/types/pal';

class MockPalStore {
  pals: Pal[] = [];
  ready: Promise<void> = Promise.resolve();
  addPal = jest.fn();
  createPal = jest.fn(async (data: Omit<Pal, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const created = {
      id: `local-mock-${this.pals.length + 1}`,
      created_at: now,
      updated_at: now,
      ...data,
    } as Pal;
    this.pals.push(created);
    return created;
  });
  updatePal = jest.fn(async (id: string, data: Partial<Pal>) => {
    const index = this.pals.findIndex(item => item.id === id);
    if (index < 0) return undefined;
    this.pals[index] = {...this.pals[index], ...data, updated_at: new Date().toISOString()};
    return this.pals[index];
  });
  deletePal = jest.fn(async (id: string) => {
    this.pals = this.pals.filter(item => item.id !== id);
    return true;
  });
  getPals = jest.fn(() => this.pals);
  getAllPals = jest.fn(() => this.pals);
  getLocalPals = jest.fn(() => this.pals.filter(item => item.source === 'local'));
  getVideoPals = jest.fn(() => this.pals.filter(item => item.capabilities?.video === true));
  getPalById = jest.fn((id: string) => this.pals.find(item => item.id === id));
}

export const mockPalStore = new MockPalStore();
export const palStore = mockPalStore;

import {fetchModelFilesDetails, fetchModelInfo} from '../../api/hf';
import {resolveHFRepo} from '../hf';

jest.mock('../../api/hf', () => ({
  fetchModelFilesDetails: jest.fn(),
  fetchModelInfo: jest.fn(),
}));

const mockFetchModelInfo = fetchModelInfo as jest.MockedFunction<
  typeof fetchModelInfo
>;
const mockFetchModelFilesDetails =
  fetchModelFilesDetails as jest.MockedFunction<
    typeof fetchModelFilesDetails
  >;

describe('resolveHFRepo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('combines repository metadata with normalized GGUF files', async () => {
    mockFetchModelInfo.mockResolvedValue({
      id: 'author/model',
      author: 'author',
      likes: 12,
      tags: ['gguf'],
    });
    mockFetchModelFilesDetails.mockResolvedValue([
      {
        type: 'file',
        oid: 'abc123',
        size: 2048,
        path: 'model.Q4_K_M.gguf',
      },
      {
        type: 'file',
        oid: 'def456',
        size: 100,
        path: 'README.md',
      },
      {
        type: 'file',
        oid: 'ghi789',
        size: 4096,
        path: 'model-00001-of-00002.gguf',
      },
    ]);

    const model = await resolveHFRepo('author/model', 'hf_token');

    expect(mockFetchModelInfo).toHaveBeenCalledWith({
      repoId: 'author/model',
      full: true,
      authToken: 'hf_token',
    });
    expect(mockFetchModelFilesDetails).toHaveBeenCalledWith(
      'author/model',
      'hf_token',
    );
    expect(model.id).toBe('author/model');
    expect(model.author).toBe('author');
    expect(model.likes).toBe(12);
    expect(model.siblings).toEqual([
      expect.objectContaining({
        rfilename: 'model.Q4_K_M.gguf',
        size: 2048,
        oid: 'abc123',
        url: 'https://huggingface.co/author/model/resolve/main/model.Q4_K_M.gguf',
      }),
    ]);
  });

  it('rejects malformed repository IDs before making requests', async () => {
    await expect(resolveHFRepo('invalid-repo-id')).rejects.toThrow(
      'A valid Hugging Face repository ID is required.',
    );
    expect(mockFetchModelInfo).not.toHaveBeenCalled();
    expect(mockFetchModelFilesDetails).not.toHaveBeenCalled();
  });
});

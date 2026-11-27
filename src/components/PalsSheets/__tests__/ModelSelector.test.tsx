import React from 'react';
import {fireEvent, render} from '../../../../jest/test-utils';
import {ModelSelector} from '../ModelSelector';

const soraModel = {
  id: 'localmind-zai-server/glm-4-plus',
  remoteModelId: 'glm-4-plus',
  serverId: 'localmind-zai-server',
  name: 'SoRa',
  origin: 'remote',
};

// The store fixture includes a legacy local model to prove it is not exposed.
jest.mock('../../../store', () => ({
  modelStore: {
    remoteModels: [
      {
        id: 'localmind-zai-server/glm-4-plus',
        remoteModelId: 'glm-4-plus',
        serverId: 'localmind-zai-server',
        name: 'SoRa',
        origin: 'remote',
      },
    ],
    availableModels: [
      {
        id: 'localmind-zai-server/glm-4-plus',
        remoteModelId: 'glm-4-plus',
        serverId: 'localmind-zai-server',
        name: 'SoRa',
        origin: 'remote',
      },
      {id: 'deepseek-local', name: 'DeepSeek', origin: 'local'},
    ],
  },
}));

describe('ModelSelector', () => {
  const defaultProps = {
    label: 'Select Model',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the single SoRa cloud model', () => {
    const {getByText} = render(
      <ModelSelector {...defaultProps} value={soraModel as any} />,
    );
    expect(getByText('Select Model')).toBeDefined();
    expect(getByText('SoRa')).toBeDefined();
  });

  it('does not expose local models as selectable options', () => {
    const {getByTestId, queryByText} = render(
      <ModelSelector {...defaultProps} testID="sora-model-selector" />,
    );
    fireEvent.press(getByTestId('sora-model-selector-button'));
    expect(queryByText('SoRa')).toBeTruthy();
    expect(queryByText('DeepSeek')).toBeNull();
  });

  it('shows required asterisk when required prop is true', () => {
    const {getByText} = render(<ModelSelector {...defaultProps} required />);
    expect(getByText('Select Model*')).toBeDefined();
  });

  it('displays helper text when provided', () => {
    const {getByText} = render(
      <ModelSelector {...defaultProps} helperText="Helper message" />,
    );
    expect(getByText('Helper message')).toBeDefined();
  });

  it('uses custom placeholder when provided', () => {
    const {getByText} = render(
      <ModelSelector {...defaultProps} placeholder="Custom placeholder" />,
    );
    expect(getByText('Custom placeholder')).toBeDefined();
  });

  it('passes through disabled and error props', () => {
    const {getByTestId} = render(
      <ModelSelector
        {...defaultProps}
        disabled
        error
        testID="model-selector"
      />,
    );
    expect(getByTestId('model-selector')).toBeDefined();
  });
});

import React from 'react';

import {runInAction} from 'mobx';

import {render} from '../../../../jest/test-utils';
import {mockLocalApiServerStore as store} from '../../../../__mocks__/stores/localApiServerStore';

jest.mock('../../../store', () => {
  const apiStore =
    require('../../../../__mocks__/stores/localApiServerStore');
  const models = require('../../../../__mocks__/stores/modelStore');
  return {
    isValidLocalApiPort: apiStore.isValidLocalApiPort,
    localApiServerStore: apiStore.mockLocalApiServerStore,
    modelStore: models.mockModelStore,
  };
});

import {LocalApiServerCard} from '../LocalApiServerCard';


const mockSheetProps: any[] = [];

jest.mock('../../../components/Sheet/Sheet', () => {
  const {Pressable, View} = require('react-native');
  const MockSheet = (props: any) => {
    mockSheetProps.push(props);
    const {children, isVisible, title, onClose} = props;
    if (!isVisible) {
      return null;
    }
    return (
      <View testID="sheet">
        <View testID="sheet-title">{title}</View>
        <Pressable testID="sheet-close" onPress={onClose} />
        {children}
      </View>
    );
  };
  MockSheet.ScrollView = ({children}: any) => <View>{children}</View>;
  MockSheet.View = ({children, testID}: any) => (
    <View testID={testID}>{children}</View>
  );
  MockSheet.Actions = ({children}: any) => <View>{children}</View>;
  return {Sheet: MockSheet};
});

const setState = (state: Partial<typeof store>) =>
  runInAction(() => Object.assign(store, state));

describe('LocalApiServerCard', () => {
  beforeEach(() => {
    setState({
      enabled: false,
      status: 'stopped',
      lastError: undefined,
      port: 8080,
      lanEnabled: false,
      hasApiKey: false,
      lanAddress: undefined,
      baseUrl: undefined,
      servedModelId: undefined,
    });
    jest.clearAllMocks();
  });

  it('renders the local API server settings and editable port', () => {
    const {getByTestId} = render(<LocalApiServerCard />);
    expect(getByTestId('local-api-server-card')).toBeTruthy();
    expect(getByTestId('local-api-server-port-input')).toBeTruthy();
    expect(getByTestId('local-api-server-switch')).toBeTruthy();
  });
});

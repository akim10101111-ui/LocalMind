import React from 'react';
import {fireEvent, render} from '../../../../../jest/test-utils';
import {ModelNotLoadedMessage} from '../ModelNotLoadedMessage';
import {initializeSoRa} from '../../../../services/soRa';
import {serverStore, uiStore} from '../../../../store';

jest.mock('../../../../services/soRa', () => ({
  initializeSoRa: jest.fn().mockResolvedValue(undefined),
}));

const customRender = (ui: React.ReactElement) =>
  render(ui, {withBottomSheetProvider: true, withNavigation: true, withSafeArea: true});

describe('ModelNotLoadedMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    serverStore.error = null;
    serverStore.isLoading = false;
  });

  it('explains that SoRa is unavailable until cloud connection is ready', () => {
    const {getByText} = customRender(<ModelNotLoadedMessage />);
    expect(getByText(
      uiStore.language === 'ru'
        ? 'SoRa пока недоступна. Проверьте подключение к интернету.'
        : 'SoRa is unavailable. Check your internet connection.',
    )).toBeTruthy();
  });

  it('retries the SoRa cloud connection instead of downloading a model', () => {
    const {getByText} = customRender(<ModelNotLoadedMessage />);
    fireEvent.press(getByText(uiStore.language === 'ru' ? 'Повторить' : 'Retry'));
    expect(initializeSoRa).toHaveBeenCalledTimes(1);
  });

  it('shows cloud connection status while the server is loading', () => {
    serverStore.isLoading = true;
    const {getByText} = customRender(<ModelNotLoadedMessage />);
    expect(getByText(uiStore.language === 'ru' ? 'Подключаем SoRa…' : 'Connecting to SoRa…')).toBeTruthy();
  });
});

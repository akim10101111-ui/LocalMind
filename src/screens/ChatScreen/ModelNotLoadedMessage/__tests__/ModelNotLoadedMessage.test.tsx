import React from 'react';

import {render, fireEvent} from '../../../../../jest/test-utils';
import {ModelNotLoadedMessage} from '../ModelNotLoadedMessage';
import {installLocalMind, localMindInstallState} from '../../../../services/localMindModel';
import {l10n} from '../../../../locales';

jest.mock('../../../../services/localMindModel', () => ({
  installLocalMind: jest.fn().mockResolvedValue(undefined),
  localMindInstallState: {phase: 'idle', isInstalling: false, percent: 0},
}));

const customRender = (ui: React.ReactElement) =>
  render(ui, {withBottomSheetProvider: true, withNavigation: true, withSafeArea: true});

describe('ModelNotLoadedMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localMindInstallState.phase = 'idle';
    localMindInstallState.isInstalling = false;
    localMindInstallState.percent = 0;
  });

  it('explains that the LocalMind model must be loaded', () => {
    const {getByText} = customRender(<ModelNotLoadedMessage />);
    expect(getByText(l10n.en.chat.pleaseLoadModel)).toBeTruthy();
  });

  it('starts the single LocalMind installer instead of opening the model catalogue', () => {
    const {getByText} = customRender(<ModelNotLoadedMessage />);
    fireEvent.press(getByText(l10n.en.chat.load));
    expect(installLocalMind).toHaveBeenCalledTimes(1);
  });

  it('does not start a second install while downloading', () => {
    localMindInstallState.phase = 'downloading';
    localMindInstallState.isInstalling = true;
    const {getByText} = customRender(<ModelNotLoadedMessage />);
    fireEvent.press(getByText(l10n.en.chat.load));
    expect(installLocalMind).not.toHaveBeenCalled();
  });

  it('offers retry after an installation failure', () => {
    localMindInstallState.phase = 'failed';
    const {getByText} = customRender(<ModelNotLoadedMessage />);
    expect(getByText('Retry')).toBeTruthy();
  });
});

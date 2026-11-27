import React from 'react';
import {fireEvent, render as baseRender} from '../../../../jest/test-utils';
import {SettingsScreen} from '../SettingsScreen';
import {uiStore} from '../../../store';

const render = (ui: React.ReactElement) =>
  baseRender(ui, {withSafeArea: true, withNavigation: true});

describe('SoRa SettingsScreen', () => {
  it('shows cloud-only SoRa controls and app preferences', () => {
    const {getByText, getByTestId, queryByText} = render(<SettingsScreen />);

    expect(getByText('Настройки SoRa')).toBeTruthy();
    expect(getByText('SoRa AI')).toBeTruthy();
    expect(getByText('Внешний вид')).toBeTruthy();
    expect(getByText('Голос и диктовка')).toBeTruthy();
    expect(getByText('История и конфиденциальность')).toBeTruthy();
    expect(getByTestId('sora-check-connection')).toBeTruthy();
    expect(queryByText('Model Initialization Settings')).toBeNull();
    expect(queryByText('GPU layers')).toBeNull();
  });

  it('binds the dark theme switch to the persisted UI preference', () => {
    const original = uiStore.colorScheme;
    const {getByTestId} = render(<SettingsScreen />);
    fireEvent(getByTestId('sora-dark-mode'), 'valueChange', original !== 'dark');
    expect(uiStore.colorScheme).toBe(original === 'dark' ? 'light' : 'dark');
    uiStore.setColorScheme(original);
  });
});

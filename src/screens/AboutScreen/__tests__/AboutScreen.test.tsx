import React from 'react';
import {Alert} from 'react-native';
import {render as baseRender, fireEvent} from '../../../../jest/test-utils';
import {AboutScreen} from '../AboutScreen';
import {l10n} from '../../../locales';

const render = (ui: React.ReactElement, options: any = {}) =>
  baseRender(ui, {withBottomSheetProvider: true, ...options});

jest.mock('react-native-device-info', () => ({
  getVersion: jest.fn().mockReturnValue('1.0.0'),
  getBuildNumber: jest.fn().mockReturnValue('100'),
}));

jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
}));

jest.spyOn(Alert, 'alert');

describe('AboutScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders LocalMind version and onboarding tour without legacy feedback', () => {
    const {getByText, queryByText} = render(<AboutScreen />);

    expect(getByText('LocalMind')).toBeTruthy();
    expect(getByText('v1.0.0 (100)')).toBeTruthy();
    expect(getByText(l10n.en.about.tour)).toBeTruthy();
    expect(queryByText(l10n.en.about.supportProject)).toBeNull();
    expect(queryByText(l10n.en.feedback.shareThoughtsButton)).toBeNull();
  });

  it('copies version to clipboard when the version button is pressed', () => {
    const {getByText} = render(<AboutScreen />);
    fireEvent.press(getByText('v1.0.0 (100)'));
    expect(Alert.alert).toHaveBeenCalledWith(
      l10n.en.about.versionCopiedTitle,
      l10n.en.about.versionCopiedDescription,
    );
  });

  it('opens bundled open-source notices without a network link', () => {
    const {getByTestId, getByText} = render(<AboutScreen />);
    fireEvent.press(getByTestId('about-open-source-notices'));
    expect(getByTestId('about-open-source-notices-sheet')).toBeTruthy();
    expect(getByText(l10n.en.about.phononNoticesCredit)).toBeTruthy();
    expect(getByText(/^## Licenses used/)).toBeTruthy();
  });

  it('shows one accessible, bundled open-source notices action', () => {
    const {getByRole} = render(<AboutScreen />);
    const notices = getByRole('button', {
      name: l10n.en.about.openSourceNotices,
    });
    expect(notices).toHaveStyle({minHeight: 44});
    expect(notices.props.testID).toBe('about-open-source-notices');
  });
});

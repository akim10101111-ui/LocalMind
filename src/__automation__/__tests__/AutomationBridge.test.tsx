import React from 'react';
import {render} from '@testing-library/react-native';

import {AutomationBridge} from '../AutomationBridge';

jest.mock('../adapters/MemoryAdapter', () => {
  const React = require('react');
  const {View} = require('react-native');
  return {
    MemoryAdapter: () => React.createElement(View, {testID: 'memory-adapter'}),
  };
});

jest.mock('../adapters/TTSAdapter', () => {
  const React = require('react');
  const {View} = require('react-native');
  return {
    TTSAdapter: () => React.createElement(View, {testID: 'tts-adapter'}),
  };
});

jest.mock('../adapters/VoiceAdapter', () => {
  const React = require('react');
  const {View} = require('react-native');
  return {
    VoiceAdapter: () => React.createElement(View, {testID: 'voice-adapter'}),
  };
});

jest.mock('../adapters/OnboardingBypass', () => {
  const React = require('react');
  const {View} = require('react-native');
  return {
    OnboardingBypass: () =>
      React.createElement(View, {testID: 'onboarding-bypass'}),
  };
});

describe('AutomationBridge', () => {
  const origE2E = (global as any).__E2E__;

  afterEach(() => {
    (global as any).__E2E__ = origE2E;
  });

  it('renders null when __E2E__ is false', () => {
    (global as any).__E2E__ = false;
    const {toJSON} = render(<AutomationBridge />);
    expect(toJSON()).toBeNull();
  });

  it('renders a non-null tree with adapter children when __E2E__ is true', () => {
    (global as any).__E2E__ = true;
    const {getByTestId} = render(<AutomationBridge />);
    // Only the mount gate is under test here. Adapter behavior and store
    // initialization are covered by each adapter's dedicated suite.
    expect(getByTestId('memory-adapter')).toBeTruthy();
    expect(getByTestId('tts-adapter')).toBeTruthy();
    expect(getByTestId('voice-adapter')).toBeTruthy();
    expect(getByTestId('onboarding-bypass')).toBeTruthy();
  });
});

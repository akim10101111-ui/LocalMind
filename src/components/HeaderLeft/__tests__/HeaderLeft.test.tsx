import React from 'react';
import {fireEvent, render} from '../../../../jest/test-utils';
import {HeaderLeft} from '../HeaderLeft';

const mockOpenDrawer = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({openDrawer: mockOpenDrawer}),
}));

describe('HeaderLeft', () => {
  beforeEach(() => mockOpenDrawer.mockClear());

  it('opens the drawer when pressed', () => {
    const {getByTestId} = render(<HeaderLeft />);
    fireEvent.press(getByTestId('menu-button'));
    expect(mockOpenDrawer).toHaveBeenCalledTimes(1);
  });
});

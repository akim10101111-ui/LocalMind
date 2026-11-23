import React from 'react';

import Clipboard from '@react-native-clipboard/clipboard';
import {runInAction} from 'mobx';
import {Keyboard} from 'react-native';

import {render, fireEvent, act} from '../../../../jest/test-utils';
import {mockLocalApiServerStore as store} from '../../../../__mocks__/stores/localApiServerStore';
import {mockModelStore} from '../../../../__mocks__/stores/modelStore';

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

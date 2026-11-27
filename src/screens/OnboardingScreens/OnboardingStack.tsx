import React, {useState} from 'react';
import {View} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';

import {ROUTES} from '../../utils/navigationConstants';
import {SplashScreen} from './SplashScreen';
import {Onboarding1Screen} from './Onboarding1Screen';
import {ModelSetupScreen} from '../ModelSetupScreen/ModelSetupScreen';
import {
  OnboardingTopChrome,
  chromeStepFromRouteName,
  type OnboardingChromeStep,
} from './components/OnboardingTopChrome';

const Stack = createStackNavigator();

/** Lightweight first-run intro; the old local-model picker is not mounted. */
export const OnboardingStack: React.FC = () => {
  const [chromeStep, setChromeStep] = useState<OnboardingChromeStep>('splash');
  return (
    <View style={{flex: 1}}>
      <Stack.Navigator
        screenOptions={{headerShown: false, gestureEnabled: false}}
        initialRouteName={ROUTES.ONBOARDING.SPLASH}
        screenListeners={{
          state: e => {
            const state = e.data?.state as
              | {index?: number; routes?: {name?: string}[]}
              | undefined;
            const active =
              state?.routes && typeof state.index === 'number'
                ? state.routes[state.index]?.name
                : undefined;
            setChromeStep(chromeStepFromRouteName(active, ROUTES.ONBOARDING));
          },
        }}>
        <Stack.Screen name={ROUTES.ONBOARDING.SPLASH} component={SplashScreen} />
        <Stack.Screen name={ROUTES.ONBOARDING.STEP_1} component={Onboarding1Screen} />
        <Stack.Screen name={ROUTES.ONBOARDING.MODEL_SETUP} component={ModelSetupScreen} />
      </Stack.Navigator>
      <OnboardingTopChrome step={chromeStep} />
    </View>
  );
};

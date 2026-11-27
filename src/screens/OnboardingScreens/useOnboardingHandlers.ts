import {useCallback, useContext, useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';

import {uiStore} from '../../store';
import {L10nContext} from '../../utils';
import {ROUTES} from '../../utils/navigationConstants';
import type {OnboardingStep} from '../../store/onboarding/types';

/** Minimal first-run flow for the single SoRa cloud assistant. */
export const useOnboardingHandlers = (step: OnboardingStep) => {
  const navigation = useNavigation<any>();
  const l10n = useContext(L10nContext);

  useEffect(() => {
    uiStore.setOnboardingStep(step);
  }, [step]);

  const next = useCallback(() => {
    if (step === 1) {
      navigation.navigate(ROUTES.ONBOARDING.MODEL_SETUP);
    }
  }, [navigation, step]);

  const skip = useCallback(() => {
    uiStore.completeOnboarding({topic: null, modelId: null});
  }, []);

  return {l10n, next, skip};
};

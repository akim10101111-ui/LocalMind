import {useCallback, useContext, useEffect, useRef, useState} from 'react';
import {useNavigation} from '@react-navigation/native';

import {uiStore} from '../../store';
import {L10nContext} from '../../utils';
import {ROUTES} from '../../utils/navigationConstants';
import type {OnboardingStep, TopicKey} from '../../store/onboarding/types';

/**
 * Shared onboarding helpers retained for type compatibility with older
 * step components. The active SoRa onboarding stack mounts only steps 1 and
 * the cloud-ready screen; finish/skip never register or download a local AI.
 */
export const useOnboardingHandlers = (step: OnboardingStep) => {
  const navigation = useNavigation<any>();
  const l10n = useContext(L10nContext);
  const finishingRef = useRef(false);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    uiStore.setOnboardingStep(step);
  }, [step]);

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const goTo = useCallback(
    (name: string) => navigation.navigate(name),
    [navigation],
  );

  const next = useCallback(() => {
    if (step === 1) {
      goTo(ROUTES.ONBOARDING.MODEL_SETUP);
    }
  }, [step, goTo]);

  const selectTopic = useCallback(
    (key: TopicKey | null) => {
      uiStore.setOnboardingTopic(key);
      // Retained for old step components, which are not mounted by SoRa.
      goTo(ROUTES.ONBOARDING.STEP_6);
    },
    [goTo],
  );

  const finish = useCallback(async () => {
    if (finishingRef.current) {
      return;
    }
    finishingRef.current = true;
    setIsFinishing(true);
    try {
      uiStore.completeOnboarding({
        topic: uiStore.onboardingState.selectedTopic,
        modelId: null,
      });
    } finally {
      finishingRef.current = false;
      setIsFinishing(false);
    }
  }, []);

  const skip = useCallback(() => {
    uiStore.completeOnboarding({
      topic: uiStore.onboardingState.selectedTopic,
      modelId: null,
    });
  }, []);

  return {l10n, next, goBack, skip, finish, selectTopic, isFinishing};
};

import {renderHook, act} from '@testing-library/react-hooks';

import {uiStore} from '../../../store';
import {ROUTES} from '../../../utils/navigationConstants';
import {useOnboardingHandlers} from '../useOnboardingHandlers';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    canGoBack: mockCanGoBack,
  }),
}));

describe('useOnboardingHandlers for SoRa cloud onboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uiStore.hasCompletedOnboarding = false;
    uiStore.onboardingState = {
      currentStep: 1,
      selectedTopic: null,
      selectedModelId: null,
    };
    (uiStore.completeOnboarding as jest.Mock) = jest.fn();
    (uiStore.setOnboardingStep as jest.Mock) = jest.fn();
    (uiStore.setOnboardingTopic as jest.Mock) = jest.fn(key => {
      uiStore.onboardingState.selectedTopic = key;
    });
  });

  it('marks the active step on mount', () => {
    renderHook(() => useOnboardingHandlers(1));
    expect(uiStore.setOnboardingStep).toHaveBeenCalledWith(1);
  });

  it('routes the first onboarding step to the cloud-ready screen', () => {
    const {result} = renderHook(() => useOnboardingHandlers(1));
    act(() => result.current.next());
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.ONBOARDING.MODEL_SETUP);
  });

  it('supports back navigation when a previous screen exists', () => {
    const {result} = renderHook(() => useOnboardingHandlers(1));
    act(() => result.current.goBack());
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('keeps topic selection compatible without choosing a model', () => {
    const {result} = renderHook(() => useOnboardingHandlers(1));
    act(() => result.current.selectTopic('smartchat'));
    expect(uiStore.setOnboardingTopic).toHaveBeenCalledWith('smartchat');
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.ONBOARDING.STEP_6);
  });

  it('skip completes onboarding without local-model registration', () => {
    uiStore.onboardingState.selectedTopic = 'smartchat';
    uiStore.onboardingState.selectedModelId = 'legacy-local-model';
    const {result} = renderHook(() => useOnboardingHandlers(1));
    act(() => result.current.skip());
    expect(uiStore.completeOnboarding).toHaveBeenCalledWith({
      topic: 'smartchat',
      modelId: null,
    });
  });

  it('finish completes onboarding without selecting or downloading a local model', async () => {
    uiStore.onboardingState.selectedTopic = 'coding';
    uiStore.onboardingState.selectedModelId = 'legacy-local-model';
    const {result} = renderHook(() => useOnboardingHandlers(1));
    await act(async () => {
      await result.current.finish();
    });
    expect(uiStore.completeOnboarding).toHaveBeenCalledWith({
      topic: 'coding',
      modelId: null,
    });
    expect(result.current.isFinishing).toBe(false);
  });
});

import * as React from 'react';
import {runInAction} from 'mobx';

import {textMessage, user} from '../../../../jest/fixtures';
import {act, fireEvent, render} from '../../../../jest/test-utils';
import {l10n} from '../../../locales';
import {asrStore, modelStore} from '../../../store';
import * as micPerm from '../../../utils/asrMicPermission';
import {ChatView} from '../ChatView';

const mockOpenMicSettings = jest
  .spyOn(micPerm, 'openMicSettings')
  .mockResolvedValue(undefined);

jest.useFakeTimers();

jest.mock('../../ChatEmptyPlaceholder', () => ({
  ChatEmptyPlaceholder: jest.fn(() => null),
}));

// Capture the transcript callback ChatView passes down through ChatInput, so a
// transcript can be injected without driving the (un-mockable) native mic. The
// callback IS ChatView's real `appendTranscript` seam — that is what's tested.
let capturedOnTranscript: ((text: string) => void) | null = null;
const mockStart = jest.fn();
const mockStop = jest.fn();
const mockCancel = jest.fn();
jest.mock('../../../hooks/useVoiceCapture', () => ({
  useVoiceCapture: ({onTranscript}: {onTranscript: (t: string) => void}) => {
    capturedOnTranscript = onTranscript;
    return {start: mockStart, stop: mockStop, cancel: mockCancel};
  },
}));

describe('ChatView voice-input append seam', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnTranscript = null;
    // Gate open + selected tier ready so the mic is actionable.
    runInAction(() => {
      modelStore.deviceTier = 'high';
      asrStore.userASROverride = true;
      asrStore.selectedTier = 'small';
      asrStore.downloadStates.small = 'ready';
      asrStore.captureState = 'idle';
    });
  });

  const renderChat = (onSendPress = jest.fn()) =>
    render(<ChatView messages={[]} onSendPress={onSendPress} user={user} />, {
      withSafeArea: true,
      withNavigation: true,
      withBottomSheetProvider: true,
    });

  it('appends a transcript onto existing typed text (does not overwrite)', () => {
    const {getByTestId} = renderChat();

    const input = getByTestId('chat-input');
    fireEvent.changeText(input, 'note:');

    expect(capturedOnTranscript).not.toBeNull();
    act(() => capturedOnTranscript?.('buy milk'));

    expect(getByTestId('chat-input').props.value).toBe('note: buy milk');
  });

  it('hides the mic for a video pal, whose composer shows promptText', () => {
    const videoPal = {id: 'video-pal', capabilities: {video: true}} as any;
    const {queryByTestId} = render(
      <ChatView
        messages={[]}
        onSendPress={jest.fn()}
        user={user}
        activePal={videoPal}
      />,
      {withSafeArea: true, withNavigation: true, withBottomSheetProvider: true},
    );

    expect(queryByTestId('mic-button')).toBeNull();
    expect(queryByTestId('mic-button-setup')).toBeNull();
  });

  it('uses the transcript verbatim when the composer is empty', () => {
    const {getByTestId} = renderChat();

    expect(capturedOnTranscript).not.toBeNull();
    act(() => capturedOnTranscript?.('buy milk'));

    expect(getByTestId('chat-input').props.value).toBe('buy milk');
  });

  it('does not auto-send the transcript', () => {
    const onSendPress = jest.fn();
    const {getByTestId} = renderChat(onSendPress);

    act(() => capturedOnTranscript?.('buy milk'));

    expect(onSendPress).not.toHaveBeenCalled();
    expect(getByTestId('chat-input').props.value).toBe('buy milk');
  });

  it('appends a second transcript onto a prior one (space-joined)', () => {
    const {getByTestId} = renderChat();

    act(() => capturedOnTranscript?.('buy milk'));
    act(() => capturedOnTranscript?.('and eggs'));

    expect(getByTestId('chat-input').props.value).toBe('buy milk and eggs');
  });

  it('starts a capture from the mic', () => {
    const {getByTestId} = renderChat();

    fireEvent.press(getByTestId('mic-button'));

    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it('replaces the control row with the recording bar while recording', () => {
    const {getByTestId, queryByTestId} = renderChat();
    expect(queryByTestId('voice-recording-bar')).toBeNull();

    act(() => {
      asrStore.setCaptureState('recording');
    });

    expect(getByTestId('voice-recording-bar')).toBeTruthy();
    expect(queryByTestId('mic-button')).toBeNull();
    expect(queryByTestId('send-button')).toBeNull();
    fireEvent.press(getByTestId('voice-stop-button'));
    expect(mockStop).toHaveBeenCalledTimes(1);
    fireEvent.press(getByTestId('voice-cancel-button'));
    expect(mockCancel).toHaveBeenCalledTimes(1);

    act(() => {
      asrStore.resetCapture();
    });
    expect(queryByTestId('voice-recording-bar')).toBeNull();
    expect(getByTestId('mic-button')).toBeTruthy();
  });

  it('surfaces a capture error in a transient snackbar', () => {
    const {getByTestId, getByText} = renderChat();

    act(() => {
      asrStore.setError('transcribe_failed');
    });

    expect(getByTestId('asr-error-snackbar')).toBeTruthy();
    expect(getByText("Couldn't transcribe — please try again.")).toBeTruthy();
  });

  it('explains a refusal for lack of memory', () => {
    const {getByText} = renderChat();

    act(() => {
      asrStore.setError('insufficient_memory');
    });

    expect(
      getByText(
        'This chat model and voice input need more memory than this phone has. Try a smaller model.',
      ),
    ).toBeTruthy();
  });

  it('explains a microphone that delivers no audio', () => {
    const {getByText} = renderChat();

    act(() => {
      asrStore.setError('mic_unavailable');
    });

    expect(
      getByText(
        "The microphone isn't responding. Try again, or switch to a smaller chat model.",
      ),
    ).toBeTruthy();
  });

  it('tells the user when part of a dictation was dropped', () => {
    const {getByText} = renderChat();

    act(() => {
      asrStore.setError('transcript_partial');
    });

    expect(
      getByText("Part of your dictation couldn't be transcribed."),
    ).toBeTruthy();
  });

  it('offers an open-Settings action when permission is blocked', () => {
    const {getByText} = renderChat();

    act(() => {
      asrStore.setError('permission_blocked');
    });

    const action = getByText('Open Settings');
    expect(action).toBeTruthy();
    act(() => {
      fireEvent.press(action);
    });
    expect(mockOpenMicSettings).toHaveBeenCalled();
  });
});

describe('ChatView message menu', () => {
  const menuLabels = l10n.en.components.chatView.menuItems;
  const answer = {
    ...textMessage,
    id: 'assistant-answer',
    author: {id: 'assistant'},
    text: 'answer',
  };

  const isDisabled = (label: string, getByText: (t: string) => any) => {
    let node = getByText(label);
    while (node) {
      const state = node.props.accessibilityState;
      if (state && 'disabled' in state) {
        return state.disabled;
      }
      node = node.parent;
    }
    return undefined;
  };

  const openMenu = (message: typeof textMessage) => {
    const view = render(
      <ChatView messages={[message]} onSendPress={jest.fn()} user={user} />,
      {withSafeArea: true, withNavigation: true, withBottomSheetProvider: true},
    );
    const point = {nativeEvent: {pageX: 0, pageY: 0}};
    if (message.author.id === user.id) {
      const userRow = view.UNSAFE_root.find(
        (node: any) =>
          typeof node.type === 'string' &&
          typeof node.props.onTouchCancel === 'function',
      );
      fireEvent(userRow, 'touchStart', point);
      act(() => {
        jest.advanceTimersByTime(500);
      });
    } else {
      fireEvent.press(view.getByTestId('message-menu-button'), point);
    }
    return view;
  };

  beforeEach(() => {
    runInAction(() => {
      modelStore.activeModelId = 'test-model-id';
    });
  });

  afterEach(() => {
    runInAction(() => {
      modelStore.activeModelId = undefined;
    });
  });

  it.each([
    ['an assistant row', answer, [menuLabels.regenerate, menuLabels.regenerateWith]],
    ['a user row', textMessage, [menuLabels.edit]],
  ])('keeps the normal actions available on %s', (_row, message, actions) => {
    const {getByText} = openMenu(message);
    for (const label of actions) {
      expect(isDisabled(label, getByText)).toBe(false);
    }
  });
});

describe('ChatView suggested prompts', () => {
  const pal = {
    id: 'pal',
    name: 'Pal',
    greeting: {text: '', suggestedPrompts: ['Tell me a joke']},
  } as any;

  const renderWithPal = () =>
    render(
      <ChatView messages={[]} activePal={pal} onSendPress={jest.fn()} user={user} />,
      {withSafeArea: true, withNavigation: true, withBottomSheetProvider: true},
    );

  beforeEach(() => {
    runInAction(() => {
      modelStore.activeModelId = 'test-model-id';
    });
  });

  afterEach(() => {
    runInAction(() => {
      modelStore.activeModelId = undefined;
    });
  });

  it('shows suggested prompts in an idle chat', () => {
    const {getByTestId} = renderWithPal();
    expect(getByTestId('suggested-prompts-row')).toBeTruthy();
  });
});

import {makeAutoObservable, runInAction} from 'mobx';
import {Platform} from 'react-native';
import {voiceModeDeviceSupported} from '../../src/services/voice/deviceGate';
import {mockModelStore} from './modelStore';

type VoicePhase = 'closed' | 'starting' | 'listening' | 'transcribing' | 'thinking' | 'speaking';
type VoiceError = 'transcribe_failed' | 'reply_failed' | 'speech_failed';

class MockVoiceModeStore {
  phase: VoicePhase = 'closed';
  micMuted = false;
  presentation: 'full' | 'bar' = 'full';
  lastError: VoiceError | null = null;
  userVoiceModeOverride: boolean | null = null;

  constructor() {
    makeAutoObservable(this, {
      setPhase: false,
      setMicMuted: false,
      setLastError: false,
      setPresentation: false,
      setUserVoiceModeOverride: false,
    });
  }

  setUserVoiceModeOverride = jest.fn((enabled: boolean) => {
    runInAction(() => { this.userVoiceModeOverride = enabled; });
  });

  setPhase = jest.fn((phase: VoicePhase) => {
    runInAction(() => {
      if (phase !== this.phase) this.lastError = null;
      this.phase = phase;
      if (phase === 'closed') {
        this.micMuted = false;
        this.presentation = 'full';
      }
    });
  });

  setMicMuted = jest.fn((muted: boolean) => {
    runInAction(() => { this.micMuted = muted; });
  });

  setLastError = jest.fn((error: VoiceError | null) => {
    runInAction(() => { this.lastError = error; });
  });

  setPresentation = jest.fn((presentation: 'full' | 'bar') => {
    runInAction(() => { this.presentation = presentation; });
  });

  get deviceSupported(): boolean {
    return voiceModeDeviceSupported(mockModelStore.deviceTier, Platform.OS);
  }

  get supported(): boolean {
    return this.userVoiceModeOverride ?? this.deviceSupported;
  }

  get isOpen(): boolean { return this.phase !== 'closed'; }
  get isFullViewOpen(): boolean {
    return this.phase !== 'closed' && this.presentation === 'full';
  }

  reset(): void {
    runInAction(() => {
      this.phase = 'closed';
      this.micMuted = false;
      this.presentation = 'full';
      this.lastError = null;
      this.userVoiceModeOverride = null;
    });
  }
}

export const mockVoiceModeStore = new MockVoiceModeStore();

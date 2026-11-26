import React, {useContext, useState} from 'react';
import {
  Keyboard,
  Pressable,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {observer} from 'mobx-react';

import {MicSetupSheet} from '../MicSetupSheet';
import {useTheme} from '../../hooks';
import {asrStore} from '../../store';
import {L10nContext} from '../../utils';
import {MicrophoneIcon, VoiceWaveformIcon} from '../../assets/icons';

import {styles} from './styles';

interface MicButtonProps {
  /** Start a voice capture. */
  onStart: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'waveform';
}

/**
 * Mic button in the composer right-controls, next to send.
 *
 * Self-gates: renders `null` when the ASR availability gate is closed. When
 * the gate is open but the in-use tier is not installed, a press opens
 * `MicSetupSheet` in place instead of recording. When ready, a tap starts a
 * capture; the composer then shows `VoiceRecordingBar`.
 */
export const MicButton: React.FC<MicButtonProps> = observer(
  ({onStart, style, variant = 'default'}) => {
    const theme = useTheme();
    const l10n = useContext(L10nContext);
    const [setupOpen, setSetupOpen] = useState(false);

    // Keep the waveform entry point visible in the composer even before
    // speech recognition is enabled; tapping it opens the ASR setup sheet.
    if (!asrStore.asrAvailable && variant !== 'waveform') {
      return null;
    }

    const icon =
      variant === 'waveform' ? (
        <VoiceWaveformIcon width={22} height={22} color={theme.colors.onSecondary} />
      ) : (
        <MicrophoneIcon
          width={18}
          height={18}
          color={theme.colors.onSurfaceVariant}
        />
      );
    const variantStyle =
      variant === 'waveform'
        ? {
            width: 40,
            height: 40,
            borderRadius: 20,
            marginLeft: 0,
            backgroundColor: theme.colors.secondary,
          }
        : undefined;

    return (
      <>
        {asrStore.asrAvailable && asrStore.isSelectedTierReady ? (
          <Pressable
            style={[styles.button, variantStyle, style]}
            onPress={onStart}
            disabled={asrStore.captureState === 'requesting_perm'}
            accessibilityRole="button"
            accessibilityLabel={l10n.voiceInput.micLabel}
            testID="mic-button">
            {icon}
          </Pressable>
        ) : (
          <Pressable
            style={[styles.button, variantStyle, style]}
            onPress={() => {
              Keyboard.dismiss();
              setSetupOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={l10n.voiceInput.setupLabel}
            testID="mic-button-setup">
            {icon}
          </Pressable>
        )}
        {setupOpen && <MicSetupSheet onClosed={() => setSetupOpen(false)} />}
      </>
    );
  },
);

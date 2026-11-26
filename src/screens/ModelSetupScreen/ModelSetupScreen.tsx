import React, {useEffect, useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {observer} from 'mobx-react';

import {uiStore} from '../../store';
import {useTheme} from '../../hooks';
import {formatBytes} from '../../utils/formatters';
import {LOCALMIND_MODEL_ID} from '../../config/localMindModel';
import {
  LOCALMIND_ERROR,
  installLocalMind,
  localMindInstallState,
} from '../../services/localMindModel';
import {OnboardingScaffold} from '../OnboardingScreens/components/OnboardingScaffold';
import {OnboardingBottomBar} from '../OnboardingScreens/components/OnboardingBottomBar';
import {OnboardingContent} from '../OnboardingScreens/components/OnboardingContent';

/** Shown to the user, so the model name is visible only on this screen. */
const MODEL_DISPLAY_NAME = 'DeepSeek-R1-Distill-Qwen-1.5B';

const COPY = {
  en: {
    eyebrow: 'Setting up LocalMind',
    title: 'Downloading your local AI',
    preparing: 'Preparing…',
    downloading:
      'Downloads once. The download keeps going in the background if you skip.',
    verifying: 'Checking the file for damage…',
    starting: 'Starting LocalMind…',
    progress: (done: string, total: string, left: string) =>
      `${done} of ${total} · ${left} left`,
    failedTitle: 'Setup did not finish',
    retry: 'Try again',
    skip: 'Skip',
    back: 'Back',
    errors: {
      register: 'Could not prepare LocalMind. Try again.',
      interrupted:
        'The download was interrupted. Tap “Try again” to resume from where it stopped.',
      metadataUnavailable:
        'Could not check the file. Connect to the internet and try again.',
      sizeMismatch: 'The file is incomplete. It will be downloaded again.',
      hashMismatch: 'The file is damaged. It will be downloaded again.',
    },
  },
  ru: {
    eyebrow: 'Установка LocalMind',
    title: 'Загружаем ваш локальный ИИ',
    preparing: 'Подготовка…',
    downloading:
      'Загружается один раз. Если пропустите, загрузка продолжится в фоне.',
    verifying: 'Проверяем файл на повреждения…',
    starting: 'Запускаем LocalMind…',
    progress: (done: string, total: string, left: string) =>
      `${done} из ${total} · осталось ${left}`,
    failedTitle: 'Установка не завершена',
    retry: 'Повторить',
    skip: 'Пропустить',
    back: 'Назад',
    errors: {
      register: 'Не удалось подготовить LocalMind. Попробуйте ещё раз.',
      interrupted:
        'Загрузка прервалась. Нажмите «Повторить», чтобы продолжить с того же места.',
      metadataUnavailable:
        'Не удалось проверить файл. Подключитесь к интернету и попробуйте снова.',
      sizeMismatch: 'Файл неполный. Он будет загружен заново.',
      hashMismatch: 'Файл повреждён. Он будет загружен заново.',
    },
  },
};

const completeOnboarding = () => {
  if (!uiStore.hasCompletedOnboarding) {
    uiStore.completeOnboarding({topic: null, modelId: LOCALMIND_MODEL_ID});
  }
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    block: {gap: 12, marginTop: 8},
    body: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSurfaceVariant,
    },
    track: {
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
      backgroundColor: theme.colors.surfaceVariant,
    },
    fill: {
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.secondary,
    },
    meta: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSurfaceVariant,
    },
    error: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.error,
    },
  });

/**
 * First-run download of the single LocalMind model, shown after the welcome
 * screen. The install itself lives in services/localMindModel; this screen
 * only renders its real state. "Skip" opens the chat immediately, and the
 * install continues in the background.
 */
export const ModelSetupScreen: React.FC = observer(() => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const copy = uiStore.language === 'ru' ? COPY.ru : COPY.en;
  const state = localMindInstallState;

  useEffect(() => {
    installLocalMind()
      .then(completeOnboarding)
      .catch(() => {
        // Failure is shown from localMindInstallState.error.
      });
  }, []);

  const messageFor = (code: string | null): string | null => {
    if (!code) {
      return null;
    }
    const map: Record<string, string> = {
      [LOCALMIND_ERROR.registerFailed]: copy.errors.register,
      [LOCALMIND_ERROR.downloadInterrupted]: copy.errors.interrupted,
      [LOCALMIND_ERROR.metadataUnavailable]: copy.errors.metadataUnavailable,
      [LOCALMIND_ERROR.sizeMismatch]: copy.errors.sizeMismatch,
      [LOCALMIND_ERROR.hashMismatch]: copy.errors.hashMismatch,
    };
    return map[code] ?? code;
  };

  const retry = () => {
    installLocalMind().then(completeOnboarding).catch(() => {});
  };

  const failed = state.phase === 'failed';
  const statusText =
    state.phase === 'downloading'
      ? copy.downloading
      : state.phase === 'verifying'
        ? copy.verifying
        : state.phase === 'starting'
          ? copy.starting
          : copy.preparing;

  return (
    <OnboardingScaffold
      step={2}
      content={
        <OnboardingContent
          eyebrow={copy.eyebrow}
          title={copy.title}
          body={
            <View style={styles.block}>
              {failed ? (
                <>
                  <Text style={styles.error}>{copy.failedTitle}</Text>
                  <Text style={styles.body}>
                    {messageFor(state.error)}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.body}>{statusText}</Text>
                  {state.phase === 'downloading' && state.bytesTotal > 0 ? (
                    <>
                      <View style={styles.track}>
                        <View
                          style={[
                            styles.fill,
                            {width: `${state.percent}%`},
                          ]}
                        />
                      </View>
                      <Text style={styles.meta}>
                        {`${state.percent}% · ${copy.progress(
                          formatBytes(state.bytesDone),
                          formatBytes(state.bytesTotal),
                          formatBytes(
                            Math.max(0, state.bytesTotal - state.bytesDone),
                          ),
                        )}`}
                      </Text>
                      <Text style={styles.meta}>{MODEL_DISPLAY_NAME}</Text>
                    </>
                  ) : null}
                </>
              )}
            </View>
          }
        />
      }
      bottomBar={
        <OnboardingBottomBar
          primaryLabel={failed ? copy.retry : copy.skip}
          onPrimary={failed ? retry : completeOnboarding}
          showBack={false}
          backAccessibilityLabel={copy.back}
        />
      }
    />
  );
});

import React from 'react';
import {View} from 'react-native';
import {Text} from 'react-native-paper';

import {uiStore} from '../../store';
import {useTheme} from '../../hooks';
import {OnboardingScaffold} from '../OnboardingScreens/components/OnboardingScaffold';
import {OnboardingBottomBar} from '../OnboardingScreens/components/OnboardingBottomBar';
import {OnboardingContent} from '../OnboardingScreens/components/OnboardingContent';

export const ModelSetupScreen: React.FC = () => {
  const theme = useTheme();
  const isRu = uiStore.language === 'ru';
  const finish = () => {
    uiStore.completeOnboarding({topic: null, modelId: null});
  };

  return (
    <OnboardingScaffold
      step={2}
      content={
        <OnboardingContent
          eyebrow={isRu ? 'Знакомство с SoRa' : 'Meet SoRa'}
          title={isRu ? 'Ваш ИИ уже готов' : 'Your AI is ready'}
          body={
            <View style={{gap: 12}}>
              <Text style={{color: theme.colors.onSurfaceVariant}}>
                {isRu
                  ? 'SoRa работает через защищённое подключение к облачному ИИ. Не нужно скачивать гигабайты моделей или настраивать устройство.'
                  : 'SoRa connects to cloud AI. There are no gigabytes of model files to download and no device setup required.'}
              </Text>
              <Text style={{color: theme.colors.onSurfaceVariant}}>
                {isRu
                  ? 'Ваши диалоги сохраняются в приложении на этом устройстве.'
                  : 'Your conversations are saved in the app on this device.'}
              </Text>
            </View>
          }
        />
      }
      bottomBar={
        <OnboardingBottomBar
          primaryLabel={isRu ? 'Начать общение' : 'Start chatting'}
          onPrimary={finish}
          showBack={false}
          backAccessibilityLabel={isRu ? 'Назад' : 'Back'}
        />
      }
    />
  );
};

import React from 'react';
import {View} from 'react-native';
import {Snackbar} from 'react-native-paper';
import {observer} from 'mobx-react';

import {useTheme} from '../../../hooks';
import {initializeSoRa} from '../../../services/soRa';
import {serverStore, uiStore} from '../../../store';
import {styles} from './styles';

export const ModelNotLoadedMessage: React.FC = observer(() => {
  const theme = useTheme();
  const isRu = uiStore.language === 'ru';
  const status = serverStore.isLoading
    ? isRu ? 'Подключаем SoRa…' : 'Connecting to SoRa…'
    : serverStore.error
      ? isRu ? 'Не удалось подключиться к SoRa. Проверьте интернет и повторите попытку.' : 'Could not connect to SoRa. Check your internet and retry.'
      : isRu ? 'SoRa пока недоступна. Проверьте подключение к интернету.' : 'SoRa is unavailable. Check your internet connection.';

  const handleRetry = async () => {
    try {
      await initializeSoRa();
    } catch (error) {
      console.warn('[SoRa] Reconnection failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Snackbar
        visible
        onDismiss={() => {}}
        action={{
          label: isRu ? 'Повторить' : 'Retry',
          onPress: handleRetry,
          labelStyle: {color: theme.colors.inverseSecondary},
          disabled: serverStore.isLoading,
        }}>
        {status}
      </Snackbar>
    </View>
  );
});

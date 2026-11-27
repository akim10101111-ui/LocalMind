import React from 'react';
import {View} from 'react-native';
import {Snackbar} from 'react-native-paper';
import {observer} from 'mobx-react';

import {useTheme} from '../../../hooks';
import {localMindInstallState, installLocalMind} from '../../../services/localMindModel';
import {uiStore} from '../../../store';
import {L10nContext} from '../../../utils';
import {styles} from './styles';

/** Retry/resume the one LocalMind model. Never route users to a model catalogue. */
export const ModelNotLoadedMessage: React.FC = observer(() => {
  const l10n = React.useContext(L10nContext);
  const theme = useTheme();
  const state = localMindInstallState;
  const russian = uiStore.language === 'ru';

  const status =
    state.phase === 'downloading'
      ? russian ? `Загружаем LocalMind… ${state.percent}%` : `Downloading LocalMind… ${state.percent}%`
      : state.phase === 'verifying'
        ? russian ? 'Проверяем целостность модели…' : 'Verifying model…'
        : state.phase === 'starting'
          ? russian ? 'Запускаем LocalMind…' : 'Starting LocalMind…'
          : state.phase === 'failed'
            ? russian ? 'Не удалось запустить LocalMind. Нажмите «Повторить».' : 'LocalMind could not start. Tap Retry.'
            : l10n.chat.pleaseLoadModel;

  const handleInstall = () => {
    if (state.isInstalling) return;
    installLocalMind().catch(error => console.warn('[LocalMind] model activation failed:', error));
  };

  return (
    <View style={styles.container}>
      <Snackbar
        visible
        onDismiss={() => {}}
        action={{
          label: state.phase === 'failed' ? (russian ? 'Повторить' : 'Retry') : l10n.chat.load,
          onPress: handleInstall,
          labelStyle: {color: theme.colors.inverseSecondary},
        }}>
        {status}
      </Snackbar>
    </View>
  );
});

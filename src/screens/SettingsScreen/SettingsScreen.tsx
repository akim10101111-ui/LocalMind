import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {observer} from 'mobx-react-lite';
import {useNavigation} from '@react-navigation/native';
import {Button, Card, Divider, Switch, Text} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';

import {LanguageSelector} from '../../components';
import {useTheme} from '../../hooks';
import {
  asrStore,
  chatSessionStore,
  serverStore,
  ttsStore,
  uiStore,
} from '../../store';
import {ROUTES} from '../../utils/navigationConstants';

const SORA_MODEL_ID = 'glm-4-plus';

export const SettingsScreen: React.FC = observer(() => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const isRu = uiStore.language === 'ru';
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {flex: 1, backgroundColor: theme.colors.background},
        content: {padding: 18, paddingBottom: 36, gap: 14},
        heading: {color: theme.colors.onBackground, marginBottom: 2},
        card: {
          borderRadius: 20,
          backgroundColor: theme.colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.outlineVariant,
        },
        cardTitle: {color: theme.colors.onSurface, fontWeight: '700'},
        description: {color: theme.colors.onSurfaceVariant, marginTop: 4},
        row: {
          minHeight: 58,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          paddingVertical: 8,
        },
        rowCopy: {flex: 1, gap: 3},
        rowTitle: {color: theme.colors.onSurface},
        rowDescription: {color: theme.colors.onSurfaceVariant},
        divider: {backgroundColor: theme.colors.outlineVariant},
        status: {
          color: theme.colors.primary,
          fontWeight: '700',
          marginTop: 8,
        },
        button: {marginTop: 14, borderRadius: 14},
        value: {color: theme.colors.onSurface, fontWeight: '600'},
        footer: {color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 4},
      }),
    [theme],
  );

  const server = serverStore.servers.find(
    item => item.url.replace(/\/+$/, '') === 'https://d1c10as5tg10-d.space-z.ai',
  );
  const remoteModels = server
    ? serverStore.serverModels.get(server.id) ?? []
    : [];
  const isConnected = remoteModels.some(model => model.id === SORA_MODEL_ID);
  const statusText = serverStore.isLoading
    ? isRu ? 'Проверяем соединение…' : 'Checking connection…'
    : isConnected
      ? isRu ? 'Подключено' : 'Connected'
      : isRu ? 'Нет соединения' : 'Not connected';

  const checkConnection = async () => {
    if (server) {
      await serverStore.fetchModelsForServer(server.id);
      return;
    }
    await serverStore.fetchAllRemoteModels();
  };

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text variant="headlineMedium" style={styles.heading}>
            {isRu ? 'Настройки SoRa' : 'SoRa settings'}
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            {isRu
              ? 'Управляйте приложением и подключением к вашему ИИ.'
              : 'Manage the app and your AI connection.'}
          </Text>
        </View>

        <Card style={styles.card} mode="contained">
          <Card.Title
            title={isRu ? 'SoRa AI' : 'SoRa AI'}
            subtitle={isRu ? 'Единый облачный ИИ · Z.AI' : 'Single cloud AI · Z.AI'}
            titleStyle={styles.cardTitle}
          />
          <Card.Content>
            <Text variant="bodyMedium" style={styles.rowDescription}>
              {isRu
                ? 'В приложении используется одна модель. Выбирать или скачивать локальные языковые модели не нужно.'
                : 'The app uses one model. No local language model needs to be selected or downloaded.'}
            </Text>
            <Text variant="labelLarge" style={styles.status}>
              {statusText}
            </Text>
            {!isConnected && serverStore.error ? (
              <Text variant="bodySmall" style={styles.rowDescription}>
                {serverStore.error}
              </Text>
            ) : null}
            <Button
              mode="contained"
              onPress={checkConnection}
              loading={serverStore.isLoading}
              disabled={serverStore.isLoading}
              style={styles.button}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              testID="sora-check-connection">
              {isRu ? 'Проверить подключение' : 'Check connection'}
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="contained">
          <Card.Title
            title={isRu ? 'Внешний вид' : 'Appearance'}
            titleStyle={styles.cardTitle}
          />
          <Card.Content>
            <View style={styles.row}>
              <View style={styles.rowCopy}>
                <Text variant="titleMedium" style={styles.rowTitle}>
                  {isRu ? 'Тёмная тема' : 'Dark theme'}
                </Text>
                <Text variant="bodySmall" style={styles.rowDescription}>
                  {isRu ? 'Чёрный фон и фирменный коралловый акцент.' : 'Dark surfaces with the SoRa coral accent.'}
                </Text>
              </View>
              <Switch
                testID="sora-dark-mode"
                value={uiStore.colorScheme === 'dark'}
                onValueChange={value => uiStore.setColorScheme(value ? 'dark' : 'light')}
              />
            </View>
            <Divider style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowCopy}>
                <Text variant="titleMedium" style={styles.rowTitle}>
                  {isRu ? 'Язык приложения' : 'App language'}
                </Text>
              </View>
              <LanguageSelector />
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="contained">
          <Card.Title
            title={isRu ? 'Голос и диктовка' : 'Voice and dictation'}
            titleStyle={styles.cardTitle}
          />
          <Card.Content>
            <View style={styles.row}>
              <View style={styles.rowCopy}>
                <Text variant="titleMedium" style={styles.rowTitle}>
                  {isRu ? 'Озвучивание ответов' : 'Read replies aloud'}
                </Text>
                <Text variant="bodySmall" style={styles.rowDescription}>
                  {isRu ? 'Разрешить SoRa озвучивать ответы.' : 'Allow SoRa to speak its replies.'}
                </Text>
              </View>
              <Switch
                testID="sora-tts-enabled"
                value={ttsStore.userTTSOverride ?? ttsStore.deviceMeetsMemory}
                onValueChange={value => ttsStore.setUserTTSOverride(value)}
              />
            </View>
            <Divider style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowCopy}>
                <Text variant="titleMedium" style={styles.rowTitle}>
                  {isRu ? 'Голосовой ввод' : 'Voice input'}
                </Text>
                <Text variant="bodySmall" style={styles.rowDescription}>
                  {isRu ? 'Преобразовывать речь в текст перед отправкой.' : 'Transcribe speech to text before sending.'}
                </Text>
              </View>
              <Switch
                testID="sora-asr-enabled"
                value={asrStore.userASROverride ?? asrStore.deviceSupported}
                onValueChange={value => asrStore.setUserASROverride(value)}
              />
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="contained">
          <Card.Title
            title={isRu ? 'История и конфиденциальность' : 'History and privacy'}
            titleStyle={styles.cardTitle}
          />
          <Card.Content>
            <View style={styles.row}>
              <View style={styles.rowCopy}>
                <Text variant="titleMedium" style={styles.rowTitle}>
                  {isRu ? 'Сохранённые диалоги' : 'Saved conversations'}
                </Text>
                <Text variant="bodySmall" style={styles.rowDescription}>
                  {isRu
                    ? 'История хранится в базе приложения на этом устройстве и не удаляется при закрытии.'
                    : 'Chat history is stored in the app database on this device and remains after closing the app.'}
                </Text>
              </View>
              <Text variant="titleMedium" style={styles.value}>
                {chatSessionStore.sessions.length}
              </Text>
            </View>
            <Divider style={styles.divider} />
            <Text variant="bodySmall" style={styles.rowDescription}>
              {isRu
                ? 'Чтобы сформировать ответ, текст отправленного сообщения и нужный контекст передаются серверу SoRa через Z.AI. История чатов остаётся в приложении.'
                : 'To generate a reply, your message and relevant context are sent to the SoRa server through Z.AI. Chat history remains in the app.'}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="contained">
          <Card.Title
            title={isRu ? 'О приложении' : 'About'}
            titleStyle={styles.cardTitle}
          />
          <Card.Content>
            <Text variant="bodyMedium" style={styles.rowDescription}>
              {isRu ? 'SoRa · Ваш ИИ-помощник' : 'SoRa · Your AI assistant'}
            </Text>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate(ROUTES.APP_INFO)}
              style={styles.button}
              textColor={theme.colors.primary}>
              {isRu ? 'Информация о SoRa' : 'About SoRa'}
            </Button>
          </Card.Content>
        </Card>

        <Text variant="bodySmall" style={styles.footer}>
          {isRu ? 'SoRa · ИИ, который всегда рядом' : 'SoRa · Intelligence at your side'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
});

import React, {useContext, useMemo, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Pressable,
} from 'react-native';

import DeviceInfo from 'react-native-device-info';
import Clipboard from '@react-native-clipboard/clipboard';
import {Text, Button} from 'react-native-paper';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {BuildInfo} from 'llama.rn';

import phononNotices from '../../assets/licenses/phononThirdPartyNotices.json';

import {CopyIcon, ChevronRightIcon} from '../../assets/icons';

import {Sheet} from '../../components';
import {useTheme} from '../../hooks';
import {createStyles} from './styles';
import {L10nContext} from '../../utils';
import {uiStore} from '../../store';
import {reflowNotice} from './reflowNotice';

const ChevronRightButtonIcon = ({color}: {color: string}) => (
  <ChevronRightIcon stroke={color} />
);

export const AboutScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);
  const l10n = useContext(L10nContext);
  const [showNotices, setShowNotices] = useState(false);
  const noticeSections = useMemo(() => phononNotices.map(reflowNotice), []);

  const legalLinks: {
    id: 'notices';
    label: string;
    role: 'button';
    onPress: () => void;
    testID?: string;
  }[] = [
    {
      id: 'notices',
      label: l10n.about.openSourceNotices,
      role: 'button',
      onPress: () => setShowNotices(true),
      testID: 'about-open-source-notices',
    },
  ];

  const [appInfo, setAppInfo] = React.useState({
    version: '',
    build: '',
  });

  React.useEffect(() => {
    const version = DeviceInfo.getVersion();
    const buildNumber = DeviceInfo.getBuildNumber();
    setAppInfo({
      version,
      build: buildNumber,
    });
  }, []);

  const copyVersionToClipboard = () => {
    const versionString = `Version ${appInfo.version} (${appInfo.build})`;
    Clipboard.setString(versionString);
    Alert.alert(
      l10n.about.versionCopiedTitle,
      l10n.about.versionCopiedDescription,
    );
  };


  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text variant="titleLarge" style={styles.title}>
                SoRa
              </Text>
              <Text variant="bodyMedium" style={styles.description}>
                {uiStore.language === 'ru' ? 'Ваш персональный ИИ-помощник на базе SoRa.' : 'Your personal AI assistant powered by SoRa.'}
              </Text>
              <View style={styles.versionContainer}>
                <TouchableOpacity
                  style={styles.versionButton}
                  onPress={copyVersionToClipboard}>
                  <Text style={styles.versionText}>
                    v{appInfo.version} ({appInfo.build})
                  </Text>
                  <CopyIcon
                    width={16}
                    height={16}
                    stroke={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.llamaBuildText}>
                llama.cpp {BuildInfo.number} ({BuildInfo.commit.substring(0, 7)}
                )
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{l10n.about.tour}</Text>
            <Text variant="bodyMedium" style={styles.description}>
              {l10n.about.tourDescription}
            </Text>
            <Button
              mode="outlined"
              onPress={() => uiStore.replayOnboarding()}
              style={styles.actionButton}
              icon={ChevronRightButtonIcon}>
              {l10n.about.showIntroButton}
            </Button>
          </View>

          <View style={styles.legalRow}>
            {legalLinks.map(link => (
              <Pressable
                key={link.id}
                accessibilityRole={link.role}
                onPress={link.onPress}
                style={styles.legalHit}
                testID={link.testID}>
                <Text style={styles.legalLink}>{link.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>


      <Sheet
        title={l10n.about.openSourceNotices}
        isVisible={showNotices}
        displayFullHeight
        onClose={() => setShowNotices(false)}>
        <Sheet.ScrollView
          contentContainerStyle={styles.noticesContent}
          testID="about-open-source-notices-sheet">
          <Text style={styles.noticesCredit}>
            {l10n.about.phononNoticesCredit}
          </Text>
          {noticeSections.map((section, i) => (
            <Text key={i} selectable style={styles.noticesText}>
              {section}
            </Text>
          ))}
        </Sheet.ScrollView>
      </Sheet>
    </SafeAreaView>
  );
};

import {StyleSheet} from 'react-native';
import {Theme} from '../../utils/types';

export const createStyles = ({theme}: {theme: Theme}) =>
  StyleSheet.create({
    sheetContainer: {
      backgroundColor: theme.colors.surface,
      flex: 1,
    },
    handle: {
      backgroundColor: theme.colors.outline,
      width: 40,
      height: 4,
      borderRadius: 2,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginVertical: 16,
    },
    tabs: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 10,
      marginBottom: 8,
      padding: 4,
      alignItems: 'center',
      height: 48,
      borderRadius: 16,
      backgroundColor: theme.colors.surfaceVariant,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    activeTab: {
      backgroundColor: theme.colors.surface,
      shadowColor: '#000000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    tabText: {
      color: theme.colors.onSurface,
    },
    activeTabText: {
      color: theme.colors.onPrimaryContainer,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginVertical: 5,
      paddingHorizontal: 16,
      paddingVertical: 15,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
    },
    activeListItem: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    itemContent: {
      flex: 1,
      marginLeft: 12,
      justifyContent: 'space-between',
    },
    itemTextContent: {
      flex: 1,
    },
    settingsButton: {
      padding: 8,
      marginLeft: 8,
    },
    itemTitle: {
      fontSize: 16,
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    activeItemTitle: {
      color: theme.colors.onTertiaryContainer,
    },
    itemSubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    activeItemSubtitle: {
      color: theme.colors.onTertiaryContainer,
    },
    scrollviewContainer: {
      paddingBottom: theme.spacing.default,
    },
    tabList: {
      flexGrow: 0,
    },
  });

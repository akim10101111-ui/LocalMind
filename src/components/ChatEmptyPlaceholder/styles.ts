import {StyleSheet} from 'react-native';
import {Theme} from '../../utils/types';

export const createStyles = ({theme}: {theme: Theme}) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 30,
      gap: 18,
    },
    title: {
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: 10,
      fontFamily: 'serif',
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '400',
      letterSpacing: -0.25,
    },
    description: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      fontSize: 14,
      lineHeight: 21,
      paddingHorizontal: 8,
    },
    button: {
      minWidth: 190,
      borderRadius: 24,
      marginTop: 4,
    },
    logo: {
      width: 52,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
  });

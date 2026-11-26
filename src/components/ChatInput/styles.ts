import {StyleSheet} from 'react-native';

import {Theme} from '../../utils/types';

export const createStyles = ({
  theme,
  isEditMode,
}: {
  theme: Theme;
  isEditMode: boolean;
}) =>
  StyleSheet.create({
    container: {
      flexDirection: 'column',
    },

    plusButton: {
      height: 36,
      width: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      backgroundColor: theme.colors.secondaryDefault,
      opacity: 1,
    },
    thinkingToggle: {
      height: 28,
      width: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 100,
      borderWidth: 1,
      marginRight: 8,
    },
    thinkingToggleLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginLeft: 8,
      // Give up width only once the pal name has none left.
      flexShrink: 0.001,
      minWidth: 32,
    },
    thinkingToggleLeftDisabled: {
      backgroundColor: 'transparent',
    },
    thinkingToggleText: {
      flexShrink: 1,
      fontSize: 12,
      fontWeight: '500',
      marginLeft: 4,
    },
    thinkingToggleTextDisabled: {
      // Dynamic color will be applied via theme
    },

    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      flexShrink: 1,
    },
    input: {
      ...theme.fonts.inputTextStyle,
      color: theme.colors.onSurface,
      flex: 1,
      maxHeight: 150,
      paddingVertical: 0,
    },
    marginRight: {
      marginRight: 16,
    },
    inputContainer: {
      flex: 1,
      flexDirection: 'column',
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      shadowColor: theme.colors.shadow,
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: theme.dark ? 0 : 0.07,
      shadowRadius: 12,
      elevation: theme.dark ? 0 : 2,
    },
    textInputArea: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 10,
      backgroundColor: theme.colors.surface,
    },
    controlBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 8,
      minHeight: 46,
      backgroundColor: theme.colors.surface,
    },
    leftControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    rightControls: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
    },
    editBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.surfaceVariant,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      zIndex: 10, // Ensure edit bar stays above other elements
    },
    editBarText: {
      color: theme.colors.onSurfaceVariant,
    },
    editBarButton: {
      margin: 0,
    },
    inputRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginTop: isEditMode ? 28 : 0,
    },
    // Image preview styles
    imagePreviewContainer: {
      marginVertical: 8,
      paddingHorizontal: 16,
    },
    imagePreviewContainerEditMode: {
      marginTop: 36, // Account for edit bar height (28px) + extra spacing (8px)
    },
    imageScrollContent: {
      paddingHorizontal: 4,
    },
    imageContainer: {
      marginHorizontal: 4,
      position: 'relative',
    },
    previewImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      backgroundColor: theme.colors.surfaceVariant,
    },
    removeImageButton: {
      position: 'absolute',
      top: 0,
      right: 0,
      margin: 0,
      padding: 0,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      width: 25,
      height: 25,
    },
    inputInnerContainer: {
      flexShrink: 1,
      flexGrow: 1,
    },
    // Camera-specific styles
    cameraButton: {
      width: 40,
      height: 40,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0,
      shadowRadius: 3.84,
      elevation: 0,
    },

    stopButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },

    micBeforeSend: {
      marginLeft: 8,
      marginRight: 0,
    },

    // Compact Video Button (for right side)
    compactVideoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
      gap: 6,
      minWidth: 85,
    },
    compactButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    // Prompt Label for Video Pals
    promptLabel: {
      marginBottom: 4,
    },
    inputWithLabel: {
      marginTop: 0,
    },
    // Helper text for model not loaded warning
    helperTextContainer: {
      position: 'absolute',
      bottom: '100%',
      right: 0,
      marginBottom: 4,
      backgroundColor: theme.colors.errorContainer,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      maxWidth: 250,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0,
      shadowRadius: 3,
      elevation: 0,
    },
    helperText: {
      color: theme.colors.onErrorContainer,
      fontSize: 11,
      lineHeight: 14,
    },
  });

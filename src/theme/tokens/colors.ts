/**
 * Color tokens — light and dark bindings.
 *
 * Sources:
 *   - Light values: current `createBaseColors(AppTheme.Light)` +
 *     `createSemanticColors(_, false)` output from `src/utils/theme.ts`,
 *     preserved verbatim (no visual regression).
 *   - Dark values: extracted from canonical Figma `RZxDJea4t6jnBZrV4YBacF`,
 *     dark band `3011:*`. Where the canonical dark binding disagreed with
 *     the current dark Theme value at a key with visible consumers, the
 *     current dark value wins to avoid visual regression; the disagreement
 *     is tracked as a designer follow-up.
 *
 * `withOpacity` calls are deferred to a util (not inlined as literals) so
 * the output is byte-identical to today's runtime computation — this is
 * what guarantees no visual regression for the surfaceContainer* + border
 * + placeholder etc keys that currently derive via opacity math.
 *
 * NOTE on imports: this module imports from `../../utils/colorUtils` only,
 * which is a pure utility (no React, no Paper, no MobX). The purity
 * constraint for this module forbids React/Paper/MobX imports only.
 */
import {withOpacity, stateLayerOpacity} from '../../utils/colorUtils';

import {TokenColors} from './types';

// Light base colors (verbatim from src/utils/theme.ts:111-147).
const LIGHT_PRIMARY = '#171717';
const LIGHT_SECONDARY = '#D97757';
const LIGHT_TERTIARY = '#B8674A';
const LIGHT_ERROR = '#FF653F';
const LIGHT_BACKGROUND = '#F6F4EF';
const LIGHT_ON_BACKGROUND = '#171717';
const LIGHT_SURFACE = '#FCFBF8';
const LIGHT_ON_SURFACE = '#171717';
const LIGHT_INVERSE_ON_SURFACE = '#fcfcfc';

export const lightColors: TokenColors = {
  // MD3 base palette (light)
  primary: LIGHT_PRIMARY,
  onPrimary: '#FFFFFF',
  primaryContainer: '#DEE0E6',
  onPrimaryContainer: '#2D2F33',
  secondary: LIGHT_SECONDARY,
  onSecondary: '#FFFFFF',
  secondaryContainer: '#F2DED5',
  onSecondaryContainer: '#6B3D2F',
  tertiary: LIGHT_TERTIARY,
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#F0E4D8',
  onTertiaryContainer: '#584238',
  error: LIGHT_ERROR,
  onError: '#FFFFFF',
  errorContainer: '#F6D9D0',
  onErrorContainer: '#6A2117',
  background: LIGHT_BACKGROUND,
  onBackground: LIGHT_ON_BACKGROUND,
  surface: LIGHT_SURFACE,
  onSurface: LIGHT_ON_SURFACE,
  surfaceVariant: '#EEEAE2',
  onSurfaceVariant: '#726D65',
  outline: withOpacity(LIGHT_PRIMARY, 0.08),
  outlineVariant: '#D9D3C9',
  mutedLight: '#EDE9E1',
  // Figma `Color/Secondary/Default` — the secondary surface used by
  // small DS buttons (back chevron, audio glyph) over the muted canvas.
  secondaryDefault: '#F1EEE8',
  // MD3 extras
  surfaceDisabled: withOpacity('#fcfcfc', 0.12),
  onSurfaceDisabled: withOpacity('#333333', 0.38),
  inverseSurface: '#3D3934',
  inverseOnSurface: LIGHT_INVERSE_ON_SURFACE,
  inversePrimary: '#E9C7B9',
  inverseSecondary: '#E5A58E',
  shadow: '#000000',
  scrim: 'rgba(0, 0, 0, 0.25)',
  backdrop: 'rgba(38, 34, 30, 0.52)',

  // Semantic surface variants (light derives via primary-tint math)
  surfaceContainerHighest: withOpacity(LIGHT_PRIMARY, 0.05),
  surfaceContainerHigh: withOpacity(LIGHT_PRIMARY, 0.03),
  surfaceContainer: withOpacity(LIGHT_PRIMARY, 0.02),
  surfaceContainerLow: withOpacity(LIGHT_PRIMARY, 0.01),
  surfaceContainerLowest: LIGHT_SURFACE,
  surfaceDim: withOpacity(LIGHT_PRIMARY, 0.06),
  surfaceBright: LIGHT_SURFACE,

  // Text
  text: LIGHT_ON_BACKGROUND,
  textSecondary: withOpacity(LIGHT_ON_SURFACE, 0.5),
  inverseText: LIGHT_INVERSE_ON_SURFACE,
  inverseTextSecondary: withOpacity(LIGHT_INVERSE_ON_SURFACE, 0.5),

  // Border / placeholder
  border: withOpacity(LIGHT_ON_SURFACE, 0.05),
  placeholder: withOpacity(LIGHT_ON_SURFACE, 0.3),

  // Interactive state opacities
  stateLayerOpacity: 0.12,
  hoverStateOpacity: stateLayerOpacity.hover,
  pressedStateOpacity: stateLayerOpacity.pressed,
  draggedStateOpacity: stateLayerOpacity.dragged,
  focusStateOpacity: stateLayerOpacity.focus,

  // Menu
  menuBackground: LIGHT_SURFACE,
  menuBackgroundDimmed: withOpacity(LIGHT_SURFACE, 0.9),
  menuBackgroundActive: withOpacity(LIGHT_PRIMARY, 0.08),
  menuSeparator: withOpacity(LIGHT_PRIMARY, 0.5),
  menuGroupSeparator: withOpacity('#000000', 0.08),
  menuText: LIGHT_ON_SURFACE,
  menuDangerText: LIGHT_ERROR,

  // Messages
  authorBubbleBackground: '#F0EEE8',
  receivedMessageDocumentIcon: LIGHT_PRIMARY,
  sentMessageDocumentIcon: LIGHT_ON_SURFACE,
  userAvatarImageBackground: 'transparent',
  userAvatarNameColors: [
    LIGHT_PRIMARY,
    LIGHT_SECONDARY,
    LIGHT_TERTIARY,
    LIGHT_ERROR,
  ],
  searchBarBackground: 'rgba(118, 118, 128, 0.12)',

  // Thinking bubble
  thinkingBubbleBackground: '#F7EAE3',
  thinkingBubbleText: '#8C4B36',
  thinkingBubbleBorder: 'rgba(140, 75, 54, 0.28)',
  thinkingBubbleShadow: '#A65F46',
  thinkingBubbleChevronBackground: 'rgba(140, 75, 54, 0.08)',
  thinkingBubbleChevronBorder: 'rgba(140, 75, 54, 0.18)',

  // Status bar
  bgStatusActive: '#22c55e',
  bgStatusIdle: '#d1d5db',
  statusLoaded: '#178543',

  // Buttons
  btnPrimaryBg: '#F8EAE4',
  btnPrimaryBorder: '#EAC7B9',
  btnPrimaryText: '#874632',
  btnReadyBg: '#ecfdf5',
  btnReadyBorder: '#bbf7d0',
  btnReadyText: '#047857',
  btnDownloadBg: '#ecfdf5',
  btnDownloadBorder: '#bbf7d0',
  btnDownloadText: '#047857',

  // Icons
  iconModelTypeText: '#8A6958',
  iconModelTypeVision: '#D97757',
  iconModelTypeAudio: '#f97316',

  // Accent — peach pill background (canonical Figma `Color/Accent/Peach`).
  accent: {
    peach: '#F6E3DA',
    // Progress-bar fill (canonical Figma `Color/Green/Strong`).
    greenStrong: '#7c8e8a',
  },
};

// Dark base values from canonical Figma. Where the canonical dark binding
// differs visibly from the current dark Theme value, the current value
// wins to avoid visual regression (tracked as a designer follow-up).
const DARK_PRIMARY = '#F5F4F0';
const DARK_SECONDARY = '#D97757';
const DARK_TERTIARY = '#E8A088';
const DARK_ERROR = '#FF653F';
const DARK_BACKGROUND = '#242321';
const DARK_ON_BACKGROUND = '#F5F4F0';
const DARK_SURFACE = '#2D2B28';
const DARK_ON_SURFACE = '#F5F4F0';
const DARK_INVERSE_ON_SURFACE = '#3A3631';

export const darkColors: TokenColors = {
  // MD3 base palette (dark) — verbatim from canonical Figma
  primary: DARK_PRIMARY,
  onPrimary: '#282521',
  primaryContainer: '#504942',
  onPrimaryContainer: '#F4EEE6',
  secondary: DARK_SECONDARY,
  onSecondary: '#FFFFFF',
  secondaryContainer: '#49372F',
  onSecondaryContainer: '#F4D7CA',
  tertiary: DARK_TERTIARY,
  onTertiary: '#312722',
  tertiaryContainer: '#4A382E',
  onTertiaryContainer: '#F0D5C6',
  error: DARK_ERROR,
  onError: '#4C100D',
  errorContainer: '#661511',
  onErrorContainer: '#E6ACA9',
  background: DARK_BACKGROUND,
  onBackground: DARK_ON_BACKGROUND,
  surface: DARK_SURFACE,
  onSurface: DARK_ON_SURFACE,
  surfaceVariant: '#3C3934',
  onSurfaceVariant: '#C5BFB5',
  outline: '#504A42',
  outlineVariant: '#625A50',
  mutedLight: '#393630',
  // Figma `Color/Secondary/Default` — dark binding from canonical file.
  secondaryDefault: '#35312C',
  // MD3 extras
  surfaceDisabled: withOpacity('#333333', 0.12),
  onSurfaceDisabled: withOpacity('#e5e5e6', 0.38),
  inverseSurface: '#EAE4DA',
  inverseOnSurface: DARK_INVERSE_ON_SURFACE,
  inversePrimary: '#E4B29F',
  inverseSecondary: LIGHT_SECONDARY, // Warm brand accent for inverse surfaces
  shadow: '#000000',
  scrim: 'rgba(0, 0, 0, 0.25)',
  backdrop: 'rgba(0, 0, 0, 0.68)',

  // Semantic surface variants (dark derives via surface-tint math)
  // Explicit binding pending in a later design-system phase.
  surfaceContainerHighest: withOpacity(DARK_SURFACE, 0.22),
  surfaceContainerHigh: withOpacity(DARK_SURFACE, 0.16),
  surfaceContainer: withOpacity(DARK_SURFACE, 0.12),
  surfaceContainerLow: withOpacity(DARK_SURFACE, 0.08),
  surfaceContainerLowest: withOpacity(DARK_SURFACE, 0.04),
  surfaceDim: withOpacity(DARK_SURFACE, 0.06),
  surfaceBright: withOpacity(DARK_SURFACE, 0.24),

  // Text
  text: DARK_ON_BACKGROUND,
  textSecondary: withOpacity(DARK_ON_SURFACE, 0.5),
  inverseText: DARK_INVERSE_ON_SURFACE,
  inverseTextSecondary: withOpacity(DARK_INVERSE_ON_SURFACE, 0.5),

  // Border / placeholder
  border: withOpacity(DARK_ON_SURFACE, 0.05),
  placeholder: withOpacity(DARK_ON_SURFACE, 0.3),

  // Interactive state opacities
  stateLayerOpacity: 0.12,
  hoverStateOpacity: stateLayerOpacity.hover,
  pressedStateOpacity: stateLayerOpacity.pressed,
  draggedStateOpacity: stateLayerOpacity.dragged,
  focusStateOpacity: stateLayerOpacity.focus,

  // Menu
  menuBackground: '#302D29',
  menuBackgroundDimmed: withOpacity(DARK_SURFACE, 0.9),
  menuBackgroundActive: withOpacity(DARK_PRIMARY, 0.08),
  menuSeparator: withOpacity(DARK_PRIMARY, 0.5),
  menuGroupSeparator: withOpacity('#FFFFFF', 0.08),
  menuText: DARK_ON_SURFACE,
  menuDangerText: DARK_ERROR,

  // Messages
  authorBubbleBackground: '#393631',
  receivedMessageDocumentIcon: DARK_PRIMARY,
  sentMessageDocumentIcon: DARK_ON_SURFACE,
  userAvatarImageBackground: 'transparent',
  userAvatarNameColors: [
    DARK_PRIMARY,
    DARK_SECONDARY,
    DARK_TERTIARY,
    DARK_ERROR,
  ],
  searchBarBackground: 'rgba(48, 45, 41, 0.94)',

  // Thinking bubble
  thinkingBubbleBackground: '#40342F',
  thinkingBubbleText: '#F0B49B',
  thinkingBubbleBorder: 'rgba(217, 119, 87, 0.45)',
  thinkingBubbleShadow: '#D97757',
  thinkingBubbleChevronBackground: 'rgba(217, 119, 87, 0.15)',
  thinkingBubbleChevronBorder: 'rgba(217, 119, 87, 0.3)',

  // Status bar
  bgStatusActive: '#22c55e',
  bgStatusIdle: '#4b5563',
  statusLoaded: '#34c768',

  // Buttons
  btnPrimaryBg: '#3C302A',
  btnPrimaryBorder: '#684537',
  btnPrimaryText: '#F0B49B',
  btnReadyBg: '#26352C',
  btnReadyBorder: '#536F59',
  btnReadyText: '#B4D1B7',
  btnDownloadBg: '#2B342B',
  btnDownloadBorder: '#50644F',
  btnDownloadText: '#B4D1B7',

  // Icons
  iconModelTypeText: '#C6B09E',
  iconModelTypeVision: '#E2A18A',
  iconModelTypeAudio: '#D9A46C',

  // Accent — peach pill background (dark binding from canonical Figma).
  accent: {
    peach: '#58372D',
    // Progress-bar fill — dark binding mirrors the light token (same hue).
    greenStrong: '#7c8e8a',
  },
};

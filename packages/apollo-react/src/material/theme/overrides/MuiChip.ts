import type { ComponentsOverrides } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiChip = (palette: Palette): ComponentsOverrides['MuiChip'] => ({
  deletable: { '&:focus:not(.Mui-disabled)': { backgroundColor: palette.semantic.colorHover } },
  // The outlined variant is border-only: undo the filled background the root slot applies,
  // keeping the hover fill for clickable chips (matches MUI's own outlined variant).
  outlined: {
    backgroundColor: 'transparent',
    '&:hover': { backgroundColor: 'transparent' },
    '&.MuiChip-clickable:hover': { backgroundColor: palette.semantic.colorHover },
  },
  root: {
    paddingLeft: token.Padding.PadL,
    paddingRight: token.Padding.PadL,
    paddingTop: token.Padding.PadXs,
    paddingBottom: token.Padding.PadXs,
    minWidth: '32px',
    fontSize: token.FontFamily.FontMSize,
    lineHeight: token.FontFamily.FontMLineHeight,
    fontWeight: token.FontFamily.FontWeightDefault,
    color: palette.semantic.colorForeground,
    backgroundColor: palette.semantic.colorBackgroundGray,
    '&:hover': { backgroundColor: palette.semantic.colorHover },
    '&.icon': {
      color: palette.semantic.colorForeground,
      paddingLeft: '0px',
      paddingRight: '0px',
    },

    // Mini Chips
    '&.warning-mini': {
      paddingLeft: '0px',
      paddingRight: '0px',
      height: '16px',
      fontSize: token.FontFamily.FontXsSize,
      lineHeight: token.FontFamily.FontXsLineHeight,
      fontStyle: 'normal',
      fontWeight: token.FontFamily.FontWeightSemibold,
      color: palette.semantic.colorWarningText,
      background: palette.semantic.colorWarningBackground,
    },

    '&.mini': {
      paddingLeft: '0px',
      paddingRight: '0px',
      height: '16px',
      fontSize: token.FontFamily.FontXsSize,
      lineHeight: token.FontFamily.FontXsLineHeight,
      fontStyle: 'normal',
      fontWeight: token.FontFamily.FontWeightSemibold,
      color: palette.semantic.colorForeground,
      background: palette.semantic.colorBackgroundSecondary,
    },

    '&.info-mini': {
      paddingLeft: '0px',
      paddingRight: '0px',
      height: '16px',
      fontSize: token.FontFamily.FontXsSize,
      lineHeight: token.FontFamily.FontXsLineHeight,
      fontStyle: 'normal',
      fontWeight: token.FontFamily.FontWeightSemibold,
      color: palette.semantic.colorInfoForeground,
      background: palette.semantic.colorInfoBackground,
    },

    '&.success-mini': {
      paddingLeft: '0px',
      paddingRight: '0px',
      height: '16px',
      fontSize: token.FontFamily.FontXsSize,
      lineHeight: token.FontFamily.FontXsLineHeight,
      fontStyle: 'normal',
      fontWeight: token.FontFamily.FontWeightSemibold,
      color: palette.semantic.colorSuccessText,
      background: palette.semantic.colorSuccessBackground,
    },

    '&.error-mini': {
      paddingLeft: '0px',
      paddingRight: '0px',
      height: '16px',
      fontSize: token.FontFamily.FontXsSize,
      lineHeight: token.FontFamily.FontXsLineHeight,
      fontStyle: 'normal',
      fontWeight: token.FontFamily.FontWeightSemibold,
      color: palette.semantic.colorErrorText,
      background: palette.semantic.colorErrorBackground,
    },

    '& .MuiChip-icon, .MuiChip-deleteIcon': {
      color: palette.semantic.colorForeground,
      width: '16px',
      height: 'auto',
    },
    '& .MuiChip-deleteIcon:hover': { color: palette.semantic.colorForeground },
    // MUI color-prop slots (filled variant). Outlined + colored is left to MUI's
    // built-in `MuiChip-outlinedXxx` styling (border/text only, transparent fill).
    '&.MuiChip-filled.MuiChip-colorPrimary': {
      color: palette.semantic.colorForegroundOnAccent,
      background: palette.semantic.colorPrimary,
      fontWeight: token.FontFamily.FontWeightSemibold,
      '&:hover': {
        color: palette.semantic.colorForegroundOnAccent,
        background: palette.semantic.colorPrimaryHover,
      },
    },
    '&.MuiChip-filled.MuiChip-colorSecondary': {
      color: palette.secondary.contrastText,
      background: palette.secondary.main,
      fontWeight: token.FontFamily.FontWeightSemibold,
      '&:hover': {
        color: palette.secondary.contrastText,
        background: palette.secondary.dark,
      },
    },
    '&.MuiChip-filled.MuiChip-colorWarning': {
      color: palette.semantic.colorWarningText,
      background: palette.semantic.colorWarningBackground,
      fontWeight: token.FontFamily.FontWeightSemibold,
      '&:hover': {
        color: palette.semantic.colorWarningText,
        background: palette.semantic.colorWarningBackground,
      },
    },
    '&.MuiChip-filled.MuiChip-colorSuccess': {
      color: palette.semantic.colorSuccessText,
      background: palette.semantic.colorSuccessBackground,
      fontWeight: token.FontFamily.FontWeightSemibold,
      '&:hover': {
        color: palette.semantic.colorSuccessText,
        background: palette.semantic.colorSuccessBackground,
      },
    },
    '&.MuiChip-filled.MuiChip-colorInfo': {
      color: palette.semantic.colorInfoForeground,
      background: palette.semantic.colorInfoBackground,
      fontWeight: token.FontFamily.FontWeightSemibold,
      '&:hover': {
        color: palette.semantic.colorInfoForeground,
        background: palette.semantic.colorInfoBackground,
      },
    },
    '&.MuiChip-filled.MuiChip-colorError': {
      color: palette.semantic.colorErrorText,
      background: palette.semantic.colorErrorBackground,
      fontWeight: token.FontFamily.FontWeightSemibold,
      '&:hover': {
        color: palette.semantic.colorErrorText,
        background: palette.semantic.colorErrorBackground,
      },
    },
  },
});

import type { ComponentsOverrides } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiTab = (palette: Palette): ComponentsOverrides['MuiTab'] => ({
  root: {
    minWidth: '50px',
    '&:not(.tiny):not(.secondary).Mui-selected': { paddingBottom: '12px' },
    '&:hover:not(.Mui-selected):not(.default)': { borderRadius: '3px' },
    '&:focus': { backgroundColor: 'transparent' },
    '&:focus-visible': {
      outline: 'none',
      color: `${palette.semantic.colorPrimary} !important`,
      backgroundColor: palette.semantic.colorSecondaryFocused,
    },
    '&.default:focus-visible': { boxShadow: `inset 0 -4px 0 0 ${palette.semantic.colorPrimary}` },
    '&.tiny:focus-visible': { boxShadow: `inset 0 -2px 0 0 ${palette.semantic.colorPrimary}` },
    '&:hover': { backgroundColor: palette.semantic.colorHover },
    '&.default': { minHeight: '40px' },
    '&.Mui-disabled': { color: palette.semantic.colorForegroundDisable },
    '&.tiny': {
      minHeight: '22px',
      minWidth: '50px',
      fontWeight: token.FontFamily.FontWeightSemibold,
      color: palette.semantic.colorForeground,
      padding: `0px ${token.Padding.PadM}`,
      '&.Mui-selected': {
        fontWeight: token.FontFamily.FontWeightSemibold,
        fontSize: token.FontFamily.FontMSize,
        lineHeight: token.FontFamily.FontMLineHeight,
        fontStyle: 'normal',
      },
    },
    '&.secondary': {
      minHeight: '0px',
      minWidth: '0px',
      borderRadius: '3px',
      padding: `${token.Padding.PadM} ${token.Padding.PadXxl}`,
      margin: token.Padding.PadXs,
      color: palette.semantic.colorForegroundDeEmp,
      '&:hover:not(.Mui-selected)': { color: palette.semantic.colorForeground },
      '&.Mui-selected': {
        backgroundColor: palette.semantic.colorHover,
        '&:focus': { backgroundColor: palette.semantic.colorSecondaryFocused },
      },
    },
  },
  textColorPrimary: {
    color: palette.semantic.colorForeground,
    fontWeight: token.FontFamily.FontWeightSemibold,
    textTransform: 'none',
    '&.Mui-selected': {
      color: palette.semantic.colorPrimary,
      fontSize: token.FontFamily.FontMSize,
      lineHeight: token.FontFamily.FontMLineHeight,
      fontStyle: 'normal',
    },
    '&.Mui-disabled': { color: palette.semantic.colorForegroundDisable },
  },
});

import type { ComponentsOverrides } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiLink = (palette: Palette): ComponentsOverrides['MuiLink'] => ({
  root: {
    color: palette.semantic.colorForegroundLink,
    fontWeight: token.FontFamily.FontWeightSemibold,
    textDecoration: 'none',
    '&:hover': { textDecoration: 'underline' },
    '&:visited': { color: palette.semantic.colorForegroundLink },
    '&:focus': { color: palette.semantic.colorForegroundLink },
    '&:active': {
      color: palette.semantic.colorForegroundLinkPressed,
      textDecoration: 'underline',
    },
    '&:focus-visible': {
      outline: 'unset',
      boxShadow: '0 0 0 2px',
      borderRadius: '2px',
    },
  },
});

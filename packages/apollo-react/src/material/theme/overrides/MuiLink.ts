import type { ComponentsOverrides } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiLink = (palette: Palette): ComponentsOverrides['MuiLink'] => ({
  root: {
    color: palette.semantic.colorForegroundLink,
    fontWeight: token.FontFamily.FontWeightSemibold,
    '&:visited': { color: palette.semantic.colorForegroundLink },
    '&:focus': { color: palette.semantic.colorForegroundLink },
    '&.Mui-focusVisible:focus-visible': {
      boxShadow: `0px 0px 0px 2px ${palette.semantic.colorFocusIndicator}`,
    },
    '&:active': { color: palette.semantic.colorForegroundLinkPressed },
  },
});

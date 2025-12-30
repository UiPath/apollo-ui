import type { ComponentsOverrides } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiInputBase = (palette: Palette): ComponentsOverrides['MuiInputBase'] => ({
  root: {
    '&.Mui-disabled': {
      color: palette.semantic.colorForegroundDisable,
      backgroundColor: palette.semantic.colorBackgroundDisabled,
      background: palette.semantic.colorBackgroundDisabled,
    },
    '&.Mui-error': {
      '.MuiOutlinedInput-notchedOutline': {
        borderColor: `${palette.semantic.colorErrorText} !important`,
      },
    },
  },
  input: {
    fontSize: token.FontFamily.FontMSize,
    fontFamily: token.FontFamily.FontNormal,
    '&.Mui-disabled': {
      color: palette.semantic.colorForegroundDisable,
      backgroundColor: palette.semantic.colorBackgroundDisabled,
      background: palette.semantic.colorBackgroundDisabled,
    },
  },
});

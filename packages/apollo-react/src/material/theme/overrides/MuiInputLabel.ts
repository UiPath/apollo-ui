import type { ComponentsOverrides } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiInputLabel = (palette: Palette): ComponentsOverrides['MuiInput'] => ({
  root: {
    margin: `${token.Padding.PadL} 0`,
    fontWeight: token.FontFamily.FontWeightSemibold,
    fontSize: token.FontFamily.FontMSize,
    lineHeight: token.FontFamily.FontMLineHeight,
    color: palette.semantic.colorForegroundDeEmp,
    '&.select-label': {
      '& + .MuiInputBase-root > .MuiOutlinedInput-notchedOutline': { top: '0px !important' },
    },
    '& + .MuiInputBase-root > .MuiOutlinedInput-notchedOutline': { top: '-5px !important' },
    '&.Mui-focused': { color: palette.semantic.colorForegroundDeEmp },
    '&.Mui-error': { color: palette.semantic.colorErrorText },
  },
});

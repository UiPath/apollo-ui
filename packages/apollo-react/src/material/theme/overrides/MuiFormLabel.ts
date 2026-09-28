import type { ComponentsOverrides } from '@mui/material/styles';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiFormLabel = (palette: Palette): ComponentsOverrides['MuiFormLabel'] => ({
  root: {
    color: palette.semantic.colorForeground,
    '&.Mui-disabled': { color: palette.semantic.colorForegroundDisable },
    '.MuiFormLabel-asterisk.Mui-error': { color: palette.semantic.colorErrorText },
  },
});

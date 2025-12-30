import type { ComponentsOverrides } from '@mui/material/styles';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiFormControlLabel = (
  palette: Palette
): ComponentsOverrides['MuiFormControlLabel'] => ({
  label: { '&.Mui-disabled': { color: palette.semantic.colorForegroundDisable } },
  root: {
    '&.Mui-disabled': { color: palette.semantic.colorForegroundDisable },
    '&.MuiFormControlLabel-label.Mui-disabled': { color: palette.semantic.colorForegroundDisable },
  },
});

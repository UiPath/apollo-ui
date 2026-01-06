import type { ComponentsOverrides } from '@mui/material/styles';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiFormLabel = (palette: Palette): ComponentsOverrides['MuiFormLabel'] => ({
  root: {
    color: palette.semantic.colorForegroundDeEmp,
    '&.Mui-error': { color: palette.semantic.colorForegroundDeEmp },
    '&.Mui-disabled': { color: palette.semantic.colorForegroundDisable },
  },
  asterisk: {
    color: 'inherit',
    '&.Mui-disabled': { color: 'inherit' },
    '&.Mui-error': { color: 'inherit' },
  },
});

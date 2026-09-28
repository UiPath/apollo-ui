import type { ComponentsOverrides } from '@mui/material/styles';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiDivider = (palette: Palette): ComponentsOverrides['MuiDivider'] => ({
  root: { backgroundColor: palette.semantic.colorBorder },
});

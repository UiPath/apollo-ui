import type { ComponentsOverrides } from '@mui/material/styles';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiCircularProgress = (
  palette: Palette
): ComponentsOverrides['MuiCircularProgress'] => ({
  root: { svg: { stroke: palette.semantic.colorPrimary } },
});

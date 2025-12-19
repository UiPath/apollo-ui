import type { ComponentsOverrides } from '@mui/material/styles';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

 
export const MuiLinearProgress = (palette: Palette): ComponentsOverrides['MuiLinearProgress'] => ({ root: { color: palette.semantic.colorPrimary } });

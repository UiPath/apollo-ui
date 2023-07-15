import type { ComponentsOverrides } from '@mui/material/styles/overrides';
import type { Palette } from '@uipath/apollo-core/lib/jss/palette';

// eslint-disable-next-line max-len
export const MuiCircularProgress = (palette: Palette): ComponentsOverrides['MuiCircularProgress'] => ({ root: { svg: { stroke: palette.semantic.colorPrimary } } });

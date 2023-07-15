import type { ComponentsOverrides } from '@mui/material/styles/overrides';
import type { Palette } from '@uipath/apollo-core/lib/jss/palette';

// eslint-disable-next-line max-len
export const MuiLinearProgress = (palette: Palette): ComponentsOverrides['MuiLinearProgress'] => ({ root: { color: palette.semantic.colorPrimary } });

import type { ComponentsOverrides } from '@mui/material/styles/overrides';
import type { Palette } from '@uipath/apollo-core/lib/jss/palette';

// eslint-disable-next-line max-len
export const MuiDivider = (palette: Palette): ComponentsOverrides['MuiDivider'] => ({ root: { backgroundColor: palette.semantic.colorBorder } });

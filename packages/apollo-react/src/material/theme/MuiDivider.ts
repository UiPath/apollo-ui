import { ComponentsOverrides } from '@mui/material/styles/overrides';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiDivider = (palette: Palette): ComponentsOverrides['MuiDivider'] => {
    return { root: { backgroundColor: palette.semantic.colorBorder } };
};

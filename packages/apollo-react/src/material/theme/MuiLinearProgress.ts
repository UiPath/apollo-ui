import { ComponentsOverrides } from '@mui/material/styles/overrides';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiLinearProgress = (palette: Palette): ComponentsOverrides['MuiLinearProgress'] => {
    return { root: { color: palette.semantic.colorPrimary } };
};

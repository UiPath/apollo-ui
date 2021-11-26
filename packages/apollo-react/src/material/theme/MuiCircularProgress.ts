import { ComponentsOverrides } from '@mui/material/styles/overrides';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiCircularProgress = (palette: Palette): ComponentsOverrides['MuiCircularProgress'] => {
    return { root: { svg: { stroke: palette.semantic.colorPrimary } } };
};

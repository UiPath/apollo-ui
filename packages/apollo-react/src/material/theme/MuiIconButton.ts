import { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiIconButton = (palette: Palette): ComponentsOverrides['MuiIconButton'] => {
    return { root: { padding: token.Padding.PadL } };
};

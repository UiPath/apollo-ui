import { ComponentsOverrides } from '@mui/material/styles/overrides';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiFormLabel = (palette: Palette): ComponentsOverrides['MuiFormLabel'] => {
    return {
        root: {
            color: palette.semantic.colorForeground,
            '&.Mui-disabled': { color: palette.semantic.colorForegroundDisable },
        },
    };
};

import { ComponentsOverrides } from '@mui/material/styles/overrides';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiFormControlLabel = (palette: Palette): ComponentsOverrides['MuiFormControlLabel'] => {
    return {
        label: { '&.Mui-disabled': { color: palette.semantic.colorForegroundDisable } },
        root: {
            '&.Mui-disabled': { color: palette.semantic.colorForegroundDisable },
            '&.MuiFormControlLabel-label.Mui-disabled': { color: palette.semantic.colorForegroundDisable },
        },
    };
};

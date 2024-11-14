import type { ComponentsOverrides } from '@mui/material/styles/overrides';
import type { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiFormLabel = (palette: Palette): ComponentsOverrides['MuiFormLabel'] => ({
    root: {
        color: palette.semantic.colorForeground,
        '&.Mui-disabled': { color: palette.semantic.colorForegroundDisable },
        '.MuiFormLabel-asterisk.Mui-error': { color: palette.semantic.colorErrorText },
    },
});

import type { ComponentsOverrides } from '@mui/material/styles/overrides';
import type { Palette } from '@uipath/apollo-core';

export const MuiButtonBase = (palette: Palette): ComponentsOverrides['MuiButtonBase'] => ({
    root: {
        '&:focus-visible': {
            outline: `solid 2px ${palette.semantic.colorForegroundEmp}`,
            backgroundColor: palette.semantic.colorIconButtonFocus,
        },
        '&:active': { backgroundColor: palette.semantic.colorIconButtonPressed },
        '&:hover': { backgroundColor: palette.semantic.colorIconButtonHover },
    },
});

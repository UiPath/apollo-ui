import { ComponentsOverrides } from '@mui/material/styles/overrides';
import { Palette } from '@uipath/apollo-core';

export const MuiButtonBase = (palette: Palette): ComponentsOverrides['MuiButtonBase'] => {
    return {
        root: {
            '&:focus-visible': {
                outline: `solid 2px ${palette.semantic.colorForegroundEmp}`,
                backgroundColor: palette.semantic.colorIconButtonFocus,
            },
            '&:active': { backgroundColor: palette.semantic.colorIconButtonPressed },
            '&:hover': { backgroundColor: palette.semantic.colorIconButtonHover },
        },
    };
};

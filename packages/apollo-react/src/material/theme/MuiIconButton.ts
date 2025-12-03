import type { ComponentsOverrides } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiIconButton = (palette: Palette): ComponentsOverrides['MuiIconButton'] => ({
    root: {
        padding: token.Padding.PadL,

        '&&:hover': { backgroundColor: palette.semantic.colorIconButtonHover },

        '&.MuiIconButton-colorPrimary, &.MuiIconButton-colorSecondary': {
            '&&:hover': { backgroundColor: palette.semantic.colorHover },
            '&&:focus-visible': { backgroundColor: palette.semantic.colorHover },
            '&&:active': { backgroundColor: palette.semantic.colorSecondaryPressed },
        },

        '&.Mui-disabled': { color: palette.semantic.colorForegroundDisable },
    },
});

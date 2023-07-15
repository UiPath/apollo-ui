import type { ComponentsOverrides } from '@mui/material/styles/overrides';
import type { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiCheckbox = (palette: Palette): ComponentsOverrides['MuiCheckbox'] => ({
    root: {
        '&.Mui-focusVisible': {
            outline: 'auto',
            backgroundColor: palette.semantic.colorToggleOffFocus,
        },
        '&:hover': { backgroundColor: palette.semantic.colorToggleOffHover },
        '&:active': { backgroundColor: palette.semantic.colorToggleOffPressed },
        '&.Mui-checked': {
            '&:hover': { backgroundColor: palette.semantic.colorToggleOnHover },
            '&:active': { backgroundColor: palette.semantic.colorToggleOnPressed },
            '&.Mui-focusVisible': { backgroundColor: palette.semantic.colorToggleOnFocus },
        },
        '&.Mui-indeterminate': {
            '&:hover': { backgroundColor: palette.semantic.colorToggleOnHover },
            '&:active': { backgroundColor: palette.semantic.colorToggleOnPressed },
            '&.Mui-focusVisible': { backgroundColor: palette.semantic.colorToggleOnFocus },
        },
    },
});

import type { ComponentsOverrides } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiFormHelperText = (palette: Palette): ComponentsOverrides['MuiFormHelperText'] => ({
    sizeSmall: { fontSize: token.FontFamily.FontXsSize },
    root: {
        fontSize: token.FontFamily.FontSSize,
        lineHeight: 1.5,
        color: palette.semantic.colorForegroundDeEmp,
        marginLeft: 0,
        marginTop: '4px',
        '&.Mui-error': { color: palette.semantic.colorErrorText },
        '&.Mui-disabled': {
            display: 'none',
            color: palette.semantic.colorForegroundDisable,
        },
    },
});

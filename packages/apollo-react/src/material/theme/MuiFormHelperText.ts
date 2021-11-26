import { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiFormHelperText = (palette: Palette): ComponentsOverrides['MuiFormHelperText'] => {
    return {
        sizeSmall: {
            fontSize: token.FontFamily.FontXsSize,
            lineHeight: token.FontFamily.FontXsLineHeight,
        },
        root: {
            fontSize: token.FontFamily.FontSSize,
            lineHeight: token.FontFamily.FontSLineHeight,
            color: palette.semantic.colorForegroundDeEmp,
            marginTop: '4px',
            '&.Mui-error': { color: palette.semantic.colorErrorText },
            '&.Mui-disabled': {
                display: 'none',
                color: palette.semantic.colorForegroundDisable,
            },
            '&$disabled': { color: palette.semantic.colorForegroundDisable },
        },
    };
};

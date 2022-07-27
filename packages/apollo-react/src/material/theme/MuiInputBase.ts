import { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiInputBase = (palette: Palette): ComponentsOverrides['MuiInputBase'] => {
    return {
        root: {
            '&.Mui-disabled': {
                color: palette.semantic.colorForegroundDisable,
                backgroundColor: palette.semantic.colorBackgroundDisabled,
                background: palette.semantic.colorBackgroundDisabled,
            },
        },
        input: {
            fontSize: token.FontFamily.FontMSize,
            fontFamily: token.FontFamily.FontNormal,
            '&.Mui-disabled': {
                color: palette.semantic.colorForegroundDisable,
                backgroundColor: palette.semantic.colorBackgroundDisabled,
                background: palette.semantic.colorBackgroundDisabled,
            },
        },
    };
};

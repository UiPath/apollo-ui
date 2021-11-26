import { ComponentsOverrides } from '@mui/material/styles/overrides';
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
            '&.Mui-disabled': {
                color: palette.semantic.colorForegroundDisable,
                backgroundColor: palette.semantic.colorBackgroundDisabled,
                background: palette.semantic.colorBackgroundDisabled,
            },
        },
    };
};

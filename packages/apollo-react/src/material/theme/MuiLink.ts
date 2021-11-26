import { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiLink = (palette: Palette): ComponentsOverrides['MuiLink'] => {
    return {
        root: {
            color: palette.semantic.colorForegroundLink,
            fontWeight: token.FontFamily.FontWeightSemibold,
            '&:visited': { color: palette.semantic.colorForegroundLink },
            '&:disabled': { color: palette.semantic.colorForegroundLinkDisabled },
            '&:focus': { color: palette.semantic.colorForegroundLink },
            '&:active': { color: palette.semantic.colorForegroundLinkPressed },
        },
    };
};

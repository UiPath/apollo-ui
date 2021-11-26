import { alpha } from '@mui/material';
import { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiAutocomplete = (palette: Palette): ComponentsOverrides['MuiAutocomplete'] => {
    return {
        root: {
            color: palette.semantic.colorForeground,
            '&$disabled': { color: palette.semantic.colorForegroundDisable },
            '& .MuiAutocomplete-inputRoot[class*="MuiOutlinedInput-root"]': {
                paddingTop: '2.38px',
                paddingBottom: '2px',
            },
        },
        paper: {
            boxShadow: token.Shadow.ShadowDp8,
            background: palette.semantic.colorBackgroundRaised,
        },
        option: {
            background: palette.semantic.colorBackgroundRaised,
            fontSize: token.FontFamily.FontMSize,
            lineHeight: token.FontFamily.FontMLineHeight,
            '&:hover': {
                backgroundColor: palette.semantic.colorHover,
                color: palette.semantic.colorForegroundDeEmp,
            },
            '&:focus': {
                backgroundColor: alpha(palette.semantic.colorPrimary, 0.1),
                color: palette.semantic.colorForegroundDeEmp,
            },
        },
        groupUl: {
            background: palette.semantic.colorBackgroundRaised,
            boxShadow: token.Shadow.ShadowDp8,
        },
    };
};

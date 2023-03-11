import { alpha } from '@mui/material';
import { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiAutocomplete = (palette: Palette): ComponentsOverrides['MuiAutocomplete'] => {
    return {
        root: {
            color: palette.semantic.colorForeground,
            '&.Mui-disabled': { color: palette.semantic.colorForegroundDisable },
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
                backgroundColor: palette.semantic.colorHover,
                color: palette.semantic.colorForegroundDeEmp,
            },
            '&.MuiAutocomplete-option.MuiAutocomplete-option[aria-selected="true"]': {
                boxShadow: `inset 4px 0px 0px ${palette.semantic.colorForegroundHigh}`,
                backgroundColor: alpha(palette.semantic.colorForegroundHigh, 0.1),
                color: palette.semantic.colorForegroundDeEmp,
            },
            '&.MuiAutocomplete-option.MuiAutocomplete-option[aria-selected="true"]:hover': {
                boxShadow: `inset 4px 0px 0px ${palette.semantic.colorForegroundHigh}`,
                backgroundColor: alpha(palette.semantic.colorForegroundHigh, 0.15),
                color: palette.semantic.colorForegroundDeEmp,
            },
            '&.MuiAutocomplete-option.MuiAutocomplete-option[aria-selected="true"]:focus': { outline: `${token.Stroke.StrokeM} solid ${palette.semantic.colorPrimaryFocused}` },
        },
        groupUl: {
            background: palette.semantic.colorBackgroundRaised,
            boxShadow: token.Shadow.ShadowDp8,
        },
    };
};

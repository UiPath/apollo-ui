import type { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';
import type { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiTab = (palette: Palette): ComponentsOverrides['MuiTab'] => ({
    root: {
        '&:hover': { backgroundColor: palette.semantic.colorHover },
        '&:focus': { backgroundColor: palette.semantic.colorSecondaryFocused },
        '&.default': { minHeight: '40px' },
        '&.Mui-disabled': { color: palette.semantic.colorForegroundDisable },
        '&:not(.tiny):not(.secondary).Mui-selected': { paddingBottom: '13px' },
        '&.tiny': {
            minHeight: '22px',
            minWidth: '50px',
            fontWeight: token.FontFamily.FontWeightSemibold,
            color: palette.semantic.colorForeground,
            padding: `0px ${token.Padding.PadM}`,
            '&.Mui-selected': {
                fontWeight: token.FontFamily.FontWeightSemibold,
                fontSize: token.FontFamily.FontMSize,
                lineHeight: token.FontFamily.FontMLineHeight,
                fontStyle: 'normal',
            },
        },
        '&.secondary': {
            minHeight: '0px',
            minWidth: '0px',
            borderRadius: '3px',
            padding: `${token.Padding.PadM} ${token.Padding.PadXxl}`,
            margin: token.Padding.PadXs,
            color: palette.semantic.colorForegroundDeEmp,
            '&:hover:not(.Mui-selected)': { color: palette.semantic.colorForeground },
            '&.Mui-selected': {
                backgroundColor: palette.semantic.colorBackgroundSecondary,
                '&:focus': { backgroundColor: palette.semantic.colorSecondaryFocused },
            },
        },
    },
    textColorPrimary: {
        color: palette.semantic.colorForeground,
        fontWeight: token.FontFamily.FontWeightSemibold,
        textTransform: 'none',
        '&.Mui-selected': {
            color: palette.semantic.colorPrimary,
            fontSize: token.FontFamily.FontMSize,
            lineHeight: token.FontFamily.FontMLineHeight,
            fontStyle: 'normal',
        },
        '&.Mui-disabled': { color: palette.semantic.colorForegroundDisable },
    },
});

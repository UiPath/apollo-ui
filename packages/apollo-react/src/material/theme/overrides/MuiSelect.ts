import type { ComponentsOverrides } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiSelect = (palette: Palette): ComponentsOverrides['MuiSelect'] => ({
    root: {
        // Remove the focus border if the dropdown menu is open
        '&.ap-dropdown-open.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: palette.semantic.colorForegroundDeEmp,
            borderWidth: token.Stroke.StrokeS,
        },
    },
    icon: {
        color: palette.semantic.colorIconDefault,
        right: token.Spacing.SpacingXs,
        '&.Mui-disabled': { color: `${palette.semantic.colorForegroundDisable} !important` },
    },
    select: {
        fontStyle: 'normal',
        fontWeight: 'normal',
        paddingTop: token.Padding.PadXl,
        paddingBottom: token.Padding.PadXl,
        paddingLeft: token.Padding.PadXxxl,
        fontSize: token.FontFamily.FontMSize,
        lineHeight: token.FontFamily.FontMLineHeight,
        color: palette.semantic.colorForeground,
        '&:focus-visible': {
            outline: `2px solid ${palette.semantic.colorFocusIndicator}`,
            outlineOffset: '-2px',
        },
    },
    standard: { paddingRight: `${token.Spacing.SpacingXl} !important` },
});

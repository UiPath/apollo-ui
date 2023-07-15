import type { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';
import type { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiSelect = (palette: Palette): ComponentsOverrides['MuiSelect'] => ({
    icon: { color: palette.semantic.colorForeground },
    select: {
        fontStyle: 'normal',
        fontWeight: 'normal',
        paddingTop: token.Padding.PadXl,
        paddingBottom: token.Padding.PadXl,
        paddingLeft: token.Padding.PadXxxl,
        fontSize: token.FontFamily.FontMSize,
        lineHeight: token.FontFamily.FontMLineHeight,
        color: palette.semantic.colorForeground,
    },
});

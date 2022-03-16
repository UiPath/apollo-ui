import { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiSelect = (palette: Palette): ComponentsOverrides['MuiSelect'] => {
    return {
        icon: { color: palette.semantic.colorForeground },
        select: {
            fontStyle: 'normal',
            fontWeight: 'normal',
            paddingTop: token.Padding.PadXl,
            paddingBottom: token.Padding.PadXl,
            paddingLeft: token.Padding.PadL,
            fontSize: token.FontFamily.FontMSize,
            lineHeight: token.FontFamily.FontMLineHeight,
            color: palette.semantic.colorForeground,
        },
    };
};

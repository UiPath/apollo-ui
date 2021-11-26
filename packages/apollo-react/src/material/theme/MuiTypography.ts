import { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiTypography = (palette: Palette): ComponentsOverrides['MuiTypography'] => {
    return {
        h1: {
            fontSize: token.FontFamily.FontHeader1Size,
            lineHeight: token.FontFamily.FontHeader1LineHeight,
            color: palette.semantic.colorForeground,
        },
        h2: {
            fontSize: token.FontFamily.FontHeader2Size,
            lineHeight: token.FontFamily.FontHeader2LineHeight,
            color: palette.semantic.colorForeground,
        },
        h3: {
            fontSize: token.FontFamily.FontHeader3Size,
            lineHeight: token.FontFamily.FontHeader3LineHeight,
            color: palette.semantic.colorForeground,
        },
        h4: {
            fontSize: token.FontFamily.FontHeader4Size,
            lineHeight: token.FontFamily.FontHeader4LineHeight,
            color: palette.semantic.colorForeground,
        },
        h5: {
            fontSize: token.FontFamily.FontLSize,
            lineHeight: token.FontFamily.FontLLineHeight,
            color: palette.semantic.colorForeground,
        },
        h6: {
            fontSize: token.FontFamily.FontMSize,
            lineHeight: token.FontFamily.FontMLineHeight,
            color: palette.semantic.colorForeground,
        },
        body1: {
            fontSize: token.FontFamily.FontMSize,
            lineHeight: token.FontFamily.FontMLineHeight,
            color: palette.semantic.colorForegroundDeEmp,
        },
    };
};


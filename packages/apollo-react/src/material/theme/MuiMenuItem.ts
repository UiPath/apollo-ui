import { alpha } from '@mui/material';
import type { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';
import type { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiMenuItem = (palette: Palette): ComponentsOverrides['MuiMenuItem'] => ({
    root: {
        fontStyle: 'normal',
        fontWeight: 'normal',
        fontSize: token.FontFamily.FontMSize,
        lineHeight: token.FontFamily.FontMLineHeight,
        color: palette.semantic.colorForegroundDeEmp,
        '&&': { minHeight: '40px' },
        '&.header': {
            color: palette.semantic.colorForeground,
            padding: `${token.Padding.PadXl} ${token.Padding.PadXxxl} ${token.Padding.PadXl} ${token.Padding.PadXxxl}`,
            fontStyle: 'normal',
            fontSize: token.FontFamily.FontLSize,
            lineHeight: token.FontFamily.FontLLineHeight,
            fontWeight: token.FontFamily.FontWeightSemibold,
        },
        '&:hover': {
            backgroundColor: alpha(palette.semantic.colorPrimary, 0.1),
            color: palette.semantic.colorForegroundDeEmp,
        },
        '&:focus': {
            backgroundColor: alpha(palette.semantic.colorPrimary, 0.1),
            color: palette.semantic.colorForegroundDeEmp,
        },
        '&.Mui-selected.Mui-selected.Mui-selected': {
            boxShadow: `inset 4px 0px 0px ${palette.semantic.colorForegroundHigh}`,
            backgroundColor: alpha(palette.semantic.colorForegroundHigh, 0.1),
            color: palette.semantic.colorForegroundDeEmp,
        },
        '&.Mui-selected.Mui-selected.Mui-selected:hover': {
            boxShadow: `inset 4px 0px 0px ${palette.semantic.colorForegroundHigh}`,
            backgroundColor: alpha(palette.semantic.colorForegroundHigh, 0.15),
            color: palette.semantic.colorForegroundDeEmp,
        },
        '&.Mui-selected:focus': { outline: `${token.Stroke.StrokeM} solid ${palette.semantic.colorPrimaryFocused}` },
    },
});

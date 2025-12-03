import type { ComponentsOverrides } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

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
            backgroundColor: palette.semantic.colorBackgroundHover,
            color: palette.semantic.colorForegroundDeEmp,
        },
        '&:focus': {
            backgroundColor: palette.semantic.colorBackgroundHover,
            color: palette.semantic.colorForegroundDeEmp,
            outline: `none`,
        },
        '&:focus-visible:after': {
            content: `''`,
            border: `${token.Stroke.StrokeM} solid ${palette.semantic.colorFocusIndicator}`,
            borderRadius: 'inherit',
            position: 'absolute',
            inset: '0px',
        },
        '&:active': {
            backgroundColor: palette.semantic.colorBackgroundPressed,
            color: palette.semantic.colorForegroundDeEmp,
        },
        '&.Mui-selected.Mui-selected.Mui-selected': {
            boxShadow: `inset 4px 0px 0px ${palette.semantic.colorSelectionIndicator}`,
            backgroundColor: palette.semantic.colorBackgroundSelected,
            color: palette.semantic.colorForegroundDeEmp,
        },
        '&.Mui-selected.Mui-selected.Mui-selected:hover': {
            boxShadow: `inset 4px 0px 0px ${palette.semantic.colorSelectionIndicator}`,
            backgroundColor: palette.semantic.colorBackgroundSelected,
            color: palette.semantic.colorForegroundDeEmp,
        },
    },
});

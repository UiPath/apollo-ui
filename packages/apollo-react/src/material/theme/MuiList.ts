import type { ComponentsOverrides } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiList = (palette: Palette): ComponentsOverrides['MuiList'] => ({
    root: {
        '&[role="menu"]': { boxShadow: token.Shadow.ShadowDp8 },
        borderRadius: '3px',
        background: palette.semantic.colorBackgroundRaised,
        paddingTop: '0',
        '&.MuiList-padding': { paddingTop: '8px' },
        '& .header': {
            color: palette.semantic.colorForeground,
            fontStyle: 'normal',
            fontWeight: token.FontFamily.FontWeightSemibold,
            fontSize: token.FontFamily.FontMSize,
            lineHeight: token.FontFamily.FontMLineHeight,
        },
        '&:hover': {
            backgroundColor: `rgba(${palette.semantic.colorPrimary}, 0.1) !important`,
            color: palette.semantic.colorForegroundDeEmp,
        },
        '&:focus': {
            backgroundColor: `rgba(${palette.semantic.colorPrimary}, 0.15) !important`,
            color: palette.semantic.colorForegroundDeEmp,
        },
    },
});

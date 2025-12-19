import type { ComponentsOverrides } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiFab = (palette: Palette): ComponentsOverrides['MuiFab'] => ({
    root: {
        backgroundColor: palette.semantic.colorBackground,
        fontSize: token.FontFamily.FontMSize,
        lineHeight: token.FontFamily.FontMLineHeight,
        fontWeight: token.FontFamily.FontWeightSemibold,
        textTransform: 'none',
        '&:focus-visible': { outlineOffset: '1px' },
        '& .MuiSvgIcon-root': {
            width: '14px',
            height: '14px',
        },
        '&:not(.MuiFab-primary):not(.MuiFab-secondary) .MuiSvgIcon-root': { color: palette.semantic.colorForegroundDeEmp },
        '&.MuiFab-extended.MuiFab-sizeSmall': {
            height: '40px',
            padding: '0 15px',
            borderRadius: '20px',
        },
        '&:hover': {
            backgroundColor: palette.semantic.colorInfoBackground,
            '& MuiFab-label': { color: palette.semantic.colorBackgroundGray },
        },
        '&:focus': {
            backgroundColor: palette.semantic.colorInfoBackground,
            '& MuiFab-label': { color: palette.semantic.colorBackgroundGray },
        },
        '&.Mui-disabled': {
            backgroundColor: palette.semantic.colorBackgroundDisabled,
            '& .MuiFab-label': { color: palette.semantic.colorForegroundDisable },
        },
    },
    primary: {
        backgroundColor: palette.semantic.colorBackground,
        '& .MuiFab-label': { color: palette.semantic.colorPrimary },
        '&:hover': {
            backgroundColor: palette.semantic.colorInfoBackground,
            '& MuiFab-label': { color: palette.semantic.colorBackgroundGray },
        },
        '&:focus': {
            backgroundColor: palette.semantic.colorInfoBackground,
            '& MuiFab-label': { color: palette.semantic.colorBackgroundGray },
        },
    },
    secondary: {
        backgroundColor: palette.semantic.colorPrimary,
        '& .MuiFab-label': { color: palette.semantic.colorBackground },
        '&:hover': {
            backgroundColor: palette.semantic.colorPrimaryHover,
            '& MuiFab-label': { color: palette.semantic.colorBackground },
        },
        '&:focus': {
            backgroundColor: palette.semantic.colorPrimaryHover,
            '& MuiFab-label': { color: palette.semantic.colorBackground },
        },
    },
});

import { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiButton = (palette: Palette): ComponentsOverrides['MuiButton'] => {
    return {
        root: {
            height: '40px',
            borderRadius: '3px',
            boxShadow: 'none',
            fontStyle: 'normal',
            fontWeight: token.FontFamily.FontWeightSemibold,
            fontSize: token.FontFamily.FontMSize,
            padding: '6px 16px',
            lineHeight: token.FontFamily.FontMLineHeight,
            textTransform: 'none',

            '&.warning': {
                border: `1px solid ${palette.semantic.colorWarn}`,
                backgroundColor: `${palette.semantic.colorWarn}`,
                color: `${palette.semantic.colorForegroundInverse}`,
                '&.MuiButton-containedSecondary': { color: `${palette.semantic.colorForegroundInverse}` },
                '&&:hover': {
                    backgroundColor: `${palette.semantic.colorWarnDarker}`,
                    border: `1px solid ${palette.semantic.colorWarnDarker}`,
                    color: `${palette.semantic.colorForegroundInverse}`,
                    boxShadow: 'none',
                },
                '&&:focus': {
                    boxShadow: 'none',
                    border: `1px solid ${palette.semantic.colorWarnDarker}`,
                    backgroundColor: `${palette.semantic.colorWarnDarker}`,
                    color: `${palette.semantic.colorForegroundInverse}`,
                },
                '&&:disabled': {
                    backgroundColor: `${palette.semantic.colorBackgroundDisabled}`,
                    color: `${palette.semantic.colorForegroundDisable}`,
                    border: `1px solid ${palette.semantic.colorBackgroundDisabled}`,
                },
            },
        },
        contained: {
            border: `1px solid ${palette.semantic.colorPrimary}`,
            backgroundColor: `${palette.semantic.colorPrimary}`,
            color: `${palette.semantic.colorForegroundInverse}`,
            '&.MuiButton-containedSecondary': { color: `${palette.semantic.colorForegroundInverse}` },
            '&&:hover': {
                backgroundColor: `${palette.semantic.colorPrimaryHover}`,
                border: `1px solid ${palette.semantic.colorPrimaryHover}`,
                color: `${palette.semantic.colorForegroundInverse}`,
                boxShadow: 'none',
            },
            '&&:focus': {
                boxShadow: 'none',
                border: `1px solid ${palette.semantic.colorPrimaryFocused}`,
                color: `${palette.semantic.colorForegroundInverse}`,
            },
            '&&:disabled': {
                backgroundColor: `${palette.semantic.colorBackgroundDisabled}`,
                color: `${palette.semantic.colorForegroundDisable}`,
                border: `1px solid ${palette.semantic.colorBackgroundDisabled}`,
            },
            '&&:focus-visible': { backgroundColor: palette.semantic.colorPrimaryFocused },
            '&&:active': { backgroundColor: palette.semantic.colorPrimaryPressed },
        },
        outlined: {
            border: `1px solid ${palette.semantic.colorBorderDeEmp}`,
            background: `${palette.semantic.colorBackground}`,
            color: `${palette.semantic.colorPrimary}`,
            '&&': { borderColor: palette.semantic.colorBorder },
            '&&:hover': { backgroundColor: palette.semantic.colorSecondaryFocused },
            '&&:focus': { backgroundColor: palette.semantic.colorSecondaryFocused },
            '&&:disabled': {
                backgroundColor: `${palette.semantic.colorBackgroundDisabled}`,
                color: `${palette.semantic.colorForegroundDisable}`,
            },
            '&&:focus-visible': { backgroundColor: palette.semantic.colorSecondaryFocused },
            '&&:active': { backgroundColor: palette.semantic.colorSecondaryPressed },
        },
        text: {
            '& .MuiButton-label': {
                paddingLeft: token.Padding.PadL,
                paddingRight: token.Padding.PadL,
            },
            '&&:hover': { backgroundColor: palette.semantic.colorSecondaryFocused },
            '&&:focus': { backgroundColor: palette.semantic.colorSecondaryFocused },
            '&&:disabled': { color: `${palette.semantic.colorForegroundDisable}` },
            '&&:focus-visible': { backgroundColor: palette.semantic.colorSecondaryFocused },
            '&&:active': { backgroundColor: palette.semantic.colorSecondaryPressed },
        },
        sizeSmall: {
            height: '32px',
            fontSize: token.FontFamily.FontMSize,
            lineHeight: token.FontFamily.FontMLineHeight,
        },
        sizeLarge: {
            height: '40px',
            fontSize: token.FontFamily.FontMSize,
            lineHeight: token.FontFamily.FontMLineHeight,
        },
        startIcon: {
            fontSize: token.Icon.IconXs,
            lineHeight: token.Icon.IconXs,
            '& img': {
                width: token.Icon.IconXs,
                height: token.Icon.IconXs,
            },
            '& svg': { width: token.Icon.IconXs },
        },
        endIcon: {
            fontSize: token.Icon.IconXs,
            lineHeight: token.Icon.IconXs,
            '& img': {
                width: token.Icon.IconXs,
                height: token.Icon.IconXs,
            },
            '& svg': { width: token.Icon.IconXs },
        },
    };
};

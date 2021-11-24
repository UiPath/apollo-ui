import { alpha } from '@mui/material';
import { PaletteOptions } from '@mui/material/styles/createPalette';
import { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';

export const MuiButton = (palette: PaletteOptions): ComponentsOverrides['MuiButton'] => {
    return {
        root: {
            height: '40px',
            borderRadius: '3px',
            boxShadow: 'none',
            fontStyle: 'normal',
            fontWeight: token.FontFamily.FontWeightSemibold,
            fontSize: token.FontFamily.FontMSize,
            padding: '6px 20px',
            lineHeight: token.FontFamily.FontMLineHeight,
            textTransform: 'none',

            '&.warning': {
                border: `1px solid ${palette.semantic.colorErrorIcon}`,
                backgroundColor: `${palette.semantic.colorErrorIcon}`,
                color: `${palette.semantic.colorForegroundInverse}`,
                '&.MuiButton-containedSecondary': { color: `${palette.semantic.colorForegroundInverse}` },
                '&&:hover': {
                    backgroundColor: `${palette.semantic.colorErrorIcon}`,
                    border: `1px solid ${palette.semantic.colorErrorIcon}`,
                    color: `${palette.semantic.colorForegroundInverse}`,
                    boxShadow: 'none',
                },
                '&&:focus': {
                    boxShadow: 'none',
                    border: `1px solid ${palette.semantic.colorErrorIcon}`,
                    backgroundColor: `${palette.semantic.colorErrorIcon}`,
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
        },
        outlined: {
            border: `1px solid ${palette.semantic.colorBorderDeEmp}`,
            background: `${palette.semantic.colorBackground}`,
            color: `${palette.semantic.colorPrimary}`,
            '&&:hover': { backgroundColor: alpha(palette.semantic.colorPrimary, 0.12) },
            '&&:focus': {
                backgroundColor: alpha(palette.semantic.colorPrimary.toString(), 0.15),
                color: palette.semantic.colorPrimaryDarker,
            },
            '&&:disabled': {
                backgroundColor: `${palette.semantic.colorBackgroundDisabled}`,
                color: `${palette.semantic.colorForegroundDisable}`,
                border: `1px solid ${palette.semantic.colorBackgroundDisabled}`,
            },
        },
        text: {
            '& .MuiButton-label': {
                paddingLeft: token.Padding.PadL,
                paddingRight: token.Padding.PadL,
            },
            '&&:hover': { backgroundColor: alpha(palette.semantic.colorPrimary, 0.12) },
            '&&:focus': {
                backgroundColor: alpha(palette.semantic.colorPrimary, 0.15),
                color: palette.semantic.colorPrimaryDarker,
            },
            '&&:disabled': { color: `${palette.semantic.colorForegroundDisable}` },
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

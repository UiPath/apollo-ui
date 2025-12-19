import type { ComponentsOverrides } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiFormControl = (palette: Palette): ComponentsOverrides['MuiFormControl'] => {
    const placeholderOverride = {
        fontSize: token.FontFamily.FontMSize,
        lineHeight: token.FontFamily.FontMLineHeight,
        color: palette.semantic.colorForegroundLight,
    };

    return {
        root: {
            '& .MuiInputLabel-formControl': {
                position: 'unset',
                transform: 'none',
            },
            '& textarea': {
                borderColor: palette.semantic.colorForegroundDeEmp,
                borderRadius: '3px',
                padding: `${token.Padding.PadM} ${token.Padding.PadL}`,
                fontSize: token.FontFamily.FontMSize,
                fontFamily: token.FontFamily.FontNormal,
                lineHeight: token.FontFamily.FontMLineHeight,
                color: palette.semantic.colorForeground,
                backgroundColor: palette.semantic.colorBackground,
            },
            '& textarea:hover': { borderColor: palette.semantic.colorForeground },
            '& textarea:focus': { outline: 'none' },
            '& textarea:placeholder': placeholderOverride,
            '& textarea::-webkit-input-placeholder': placeholderOverride,
            '& textarea:-moz-placeholder': placeholderOverride,
            '& textarea::-moz-placeholder': placeholderOverride,
            '& textarea:-ms-input-placeholder': placeholderOverride,
        },
    };
};

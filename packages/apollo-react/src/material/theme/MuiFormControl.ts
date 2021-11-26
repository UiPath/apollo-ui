import { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

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
                borderColor: palette.semantic.colorBorder,
                borderRadius: '3px',
                padding: `${token.Padding.PadM} ${token.Padding.PadL}`,
                fontSize: token.FontFamily.FontMSize,
                lineHeight: token.FontFamily.FontMLineHeight,
                color: palette.semantic.colorForeground,
                backgroundColor: palette.semantic.colorBackground,
            },
            '& textarea:focus': { outline: 'none' },
            '& textarea:placeholder': placeholderOverride,
            '& textarea::-webkit-input-placeholder': placeholderOverride,
            '& textarea:-moz-placeholder': placeholderOverride,
            '& textarea::-moz-placeholder': placeholderOverride,
            '& textarea:-ms-input-placeholder': placeholderOverride,
        },
    };
};

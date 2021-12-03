import { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiOutlinedInput = (palette: Palette): ComponentsOverrides['MuiOutlinedInput'] => {
    return {
        inputSizeSmall: {
            paddingTop: '7.38px',
            paddingBottom: '8px',
            '&.disabled': {
                paddingTop: '7.38px',
                paddingBottom: '8px',
            },
        },
        root: {
            '&:hover:not(.Mui-focused)': { '& .MuiOutlinedInput-notchedOutline': { borderColor: palette.semantic.colorForegroundDeEmp } },
            '& .MuiOutlinedInput-notchedOutline': {
                top: 0,
                borderColor: palette.semantic.colorBorder,
                '& legend': { '& span': { display: 'none' } },
            },
        },
        input: {
            paddingTop: '11.38px',
            paddingBottom: '12px',
            height: '16.625px',
            color: palette.semantic.colorForeground,
            fontSize: token.FontFamily.FontMSize,
            lineHeight: token.FontFamily.FontMLineHeight,
            '&::placeholder': {
                opacity: 1,
                color: palette.semantic.colorForegroundLight,
            },
            '&.disabled': {
                paddingTop: '11.38px',
                paddingBottom: '12px',
            },
            '&&.MuiAutocomplete-input': {
                paddingTop: '9.5px',
                paddingBottom: '9.5px',
                height: '16.625px',
            },
            '&&.MuiSelect-select': {
                paddingTop: '10px',
                paddingBottom: '10px',
                paddingLeft: '8px',
                minHeight: '20px',
            },
        },
        multiline: {
            padding: '4px',
            color: palette.semantic.colorForeground,
            fontSize: token.FontFamily.FontMSize,
            lineHeight: token.FontFamily.FontMLineHeight,
        },
        adornedStart: {
            paddingLeft: token.Padding.PadL,
            color: palette.semantic.colorIconDefault,
        },
        adornedEnd: { color: palette.semantic.colorIconDefault },
    };
};

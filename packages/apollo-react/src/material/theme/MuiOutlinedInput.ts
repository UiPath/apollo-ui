import type { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';
import type { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiOutlinedInput = (palette: Palette): ComponentsOverrides['MuiOutlinedInput'] => ({
    inputSizeSmall: {
        paddingLeft: token.Padding.PadXxxl,
        paddingRight: token.Padding.PadXxxl,
        paddingTop: '7.38px',
        paddingBottom: '8px',
        '&.disabled': {
            paddingLeft: token.Padding.PadXxxl,
            paddingRight: token.Padding.PadXxxl,
            paddingTop: '7.38px',
            paddingBottom: '8px',
        },
    },
    root: {
        backgroundColor: palette.semantic.colorBackground,
        '&:hover:not(.Mui-focused)': { '& .MuiOutlinedInput-notchedOutline': { borderColor: palette.semantic.colorForeground } },
        '& .MuiOutlinedInput-notchedOutline': {
            top: 0,
            borderColor: palette.semantic.colorForegroundDeEmp,
            '& legend': { '& span': { display: 'none' } },
        },
        '&.Mui-disabled .MuiOutlinedInput-notchedOutline': { borderColor: palette.semantic.colorBorderDisabled },
        '&.Mui-disabled:hover .MuiOutlinedInput-notchedOutline': { borderColor: palette.semantic.colorBorderDisabled },
        '& svg': { display: 'block' },
    },
    input: {
        paddingLeft: token.Padding.PadXxxl,
        paddingRight: token.Padding.PadXxxl,
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
            paddingLeft: token.Padding.PadXxxl,
            paddingRight: token.Padding.PadXxxl,
        },
        '&&.MuiAutocomplete-input': {
            paddingTop: '9.5px',
            paddingBottom: '9.5px',
            height: '16.625px',
        },
        '&&.MuiSelect-select': {
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: token.Padding.PadXxxl,
            minHeight: '20px',
        },
    },
    multiline: {
        padding: '4px',
        color: palette.semantic.colorForeground,
        fontSize: token.FontFamily.FontMSize,
        lineHeight: token.FontFamily.FontMLineHeight,
        backgroundColor: palette.semantic.colorBackground,
    },
    adornedStart: {
        paddingLeft: token.Padding.PadL,
        color: palette.semantic.colorIconDefault,
    },
    inputAdornedStart: { paddingLeft: token.Padding.PadL },
    adornedEnd: {
        color: palette.semantic.colorIconDefault,
        paddingRight: token.Padding.PadL,
    },
    inputAdornedEnd: { paddingRight: token.Padding.PadL },
});

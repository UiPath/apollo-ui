import type { ComponentsOverrides } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiSlider = (palette: Palette): ComponentsOverrides['MuiSlider'] => ({
    root: {
        fontSize: token.FontFamily.FontMSize,
        '& .MuiSlider-valueLabel': {
            lineHeight: 1.2,
            fontSize: token.FontFamily.FontMSize,
            background: 'unset',
            padding: 0,
            width: 32,
            height: 32,
            borderRadius: '50% 50% 50% 0',
            backgroundColor: palette.semantic.colorPrimary,
            transformOrigin: 'bottom left',
            transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
            '&:before': { display: 'none' },
            '&.MuiSlider-valueLabelOpen': { transform: 'translate(50%, -100%) rotate(-45deg) scale(1)' },
            '& > *': { transform: 'rotate(45deg)' },
        },
        '& .MuiSlider-thumb': {
            width: '14px',
            height: '14px',
        },
    },
});

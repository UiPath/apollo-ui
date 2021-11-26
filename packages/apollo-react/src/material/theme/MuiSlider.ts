import { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';

export const MuiSlider = (): ComponentsOverrides['MuiSlider'] => {
    return {
        root: {
            fontSize: token.FontFamily.FontMSize,
            '& .MuiSlider-valueLabel': { fontSize: token.FontFamily.FontMSize },
        },
    };
};

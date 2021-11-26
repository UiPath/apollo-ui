import { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';

export const MuiInputAdornment = (): ComponentsOverrides['MuiInputAdornment'] => {
    return {
        root: {
            '& img': { width: token.Icon.IconM },
            width: token.Icon.IconM,
        },
    };
};

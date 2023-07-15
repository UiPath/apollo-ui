import type { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';

export const MuiInputAdornment = (): ComponentsOverrides['MuiInputAdornment'] => ({
    root: {
        '& img': { width: token.Icon.IconM },
        width: token.Icon.IconM,
        minWidth: 'min-content', // For long text not to overflow
    },
});

import { ComponentsOverrides } from '@mui/material/styles/overrides';

export const MuiButtonBase = (): ComponentsOverrides['MuiButtonBase'] => {
    return { root: { '&:focus-visible': { outline: 'revert' } } };
};

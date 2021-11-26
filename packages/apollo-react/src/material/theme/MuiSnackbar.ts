import { ComponentsOverrides } from '@mui/material/styles/overrides';

export const MuiSnackbar = (): ComponentsOverrides['MuiSnackbar'] => {
    return { root: { '&.MuiSnackbar-anchorOriginTopCenter': { top: '80px' } } };
};

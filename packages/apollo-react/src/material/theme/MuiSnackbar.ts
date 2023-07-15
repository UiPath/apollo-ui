import type { ComponentsOverrides } from '@mui/material/styles/overrides';

export const MuiSnackbar = (): ComponentsOverrides['MuiSnackbar'] => ({ root: { '&.MuiSnackbar-anchorOriginTopCenter': { top: '80px' } } });

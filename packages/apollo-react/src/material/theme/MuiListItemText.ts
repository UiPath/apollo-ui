import type { ComponentsOverrides } from '@mui/material/styles/overrides';

export const MuiListItemText = (): ComponentsOverrides['MuiListItemText'] => ({
    root: {
        marginTop: '0',
        marginBottom: '0',
    },
});

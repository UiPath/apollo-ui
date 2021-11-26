import { ComponentsOverrides } from '@mui/material/styles/overrides';

export const MuiListItemText = (): ComponentsOverrides['MuiListItemText'] => {
    return {
        root: {
            marginTop: '0',
            marginBottom: '0',
        },
    };
};

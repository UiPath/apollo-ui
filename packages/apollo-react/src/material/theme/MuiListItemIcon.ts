import type { ComponentsOverrides } from '@mui/material/styles/overrides';
import type { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiListItemIcon = (palette: Palette): ComponentsOverrides['MuiListItemIcon'] => ({
    root: {
        color: palette.semantic.colorIconDefault,
        minWidth: '32px',

        '& .small': { fontSize: '1rem' },
    },
});

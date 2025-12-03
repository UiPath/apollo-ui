import type { ComponentsOverrides } from '@mui/material/styles';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiListItemIcon = (palette: Palette): ComponentsOverrides['MuiListItemIcon'] => ({
    root: {
        color: palette.semantic.colorIconDefault,
        minWidth: '32px',

        '& .small': { fontSize: '1rem' },
    },
});

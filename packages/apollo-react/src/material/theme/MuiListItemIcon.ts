import { ComponentsOverrides } from '@mui/material/styles/overrides';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiListItemIcon = (palette: Palette): ComponentsOverrides['MuiListItemIcon'] => {
    return {
        root: {
            color: palette.semantic.colorIconDefault,
            minWidth: '32px',

            '& .small': { fontSize: '1rem' },
        },
    };
};

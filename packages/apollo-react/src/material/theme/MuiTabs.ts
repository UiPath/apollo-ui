import type { ComponentsOverrides } from '@mui/material/styles';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiTabs = (palette: Palette): ComponentsOverrides['MuiTabs'] => ({
    root: {
        '&.tiny': {
            minHeight: '22px',
            '& .MuiTabs-indicator': { height: '2px' },
        },
        '&.default': {
            minHeight: '40px',
            '& .MuiTabs-indicator': { height: '4px' },
        },
        '&.secondary': { '& .MuiTabs-indicator': { display: 'none' } },
    },
    indicator: {
        backgroundColor: palette.semantic.colorPrimary,
        height: '4px',
    },
});

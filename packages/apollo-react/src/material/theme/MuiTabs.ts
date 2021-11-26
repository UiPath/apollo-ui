import { ComponentsOverrides } from '@mui/material/styles/overrides';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiTabs = (palette: Palette): ComponentsOverrides['MuiTabs'] => {
    return {
        root: {
            '&.tiny': {
                minHeight: '22px',
                '& .MuiTabs-indicator': { height: '2px' },
            },
            '&.default': {
                minHeight: '40px',
                '& .MuiTabs-indicator': { height: '4px' },
            },
        },
        indicator: {
            backgroundColor: palette.semantic.colorPrimary,
            height: '4px',
        },
    };
};

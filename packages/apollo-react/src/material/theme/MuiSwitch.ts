import { ComponentsOverrides } from '@mui/material/styles/overrides';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiSwitch = (palette: Palette): ComponentsOverrides['MuiSwitch'] => {
    return {
        root: {
            '& .MuiSwitch-track': {
                backgroundColor: palette.semantic.colorBackgroundGrayEmp,
                opacity: 1,
            },
        },
    };
};

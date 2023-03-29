import { ComponentsOverrides } from '@mui/material/styles/overrides';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiSwitch = (palette: Palette): ComponentsOverrides['MuiSwitch'] => {
    return {
        root: {
            '& .MuiSwitch-track': {
                backgroundColor: palette.semantic.colorToggleTrackOff,
                opacity: 1,
            },
            '& .MuiSwitch-thumb': { backgroundColor: palette.semantic.colorToggleThumbOff },

            '& .MuiSwitch-switchBase.Mui-disabled + .MuiSwitch-track': {
                backgroundColor: palette.semantic.colorToggleTrackOffDisabled,
                opacity: 1,
            },
            '& .MuiSwitch-switchBase.Mui-disabled .MuiSwitch-thumb': { backgroundColor: palette.semantic.colorToggleThumbOffDisabled },

            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: palette.semantic.colorToggleTrackOn },
            '& .MuiSwitch-switchBase.Mui-checked .MuiSwitch-thumb': { backgroundColor: palette.semantic.colorToggleThumbOn },

            // eslint-disable-next-line max-len
            '& .MuiSwitch-switchBase.Mui-checked.Mui-disabled + .MuiSwitch-track': { backgroundColor: palette.semantic.colorToggleTrackOnDisabled },
            // eslint-disable-next-line max-len
            '& .MuiSwitch-switchBase.Mui-checked.Mui-disabled .MuiSwitch-thumb': { backgroundColor: palette.semantic.colorToggleThumbOnDisabled },
        },
    };
};

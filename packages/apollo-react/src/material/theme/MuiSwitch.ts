import { ComponentsOverrides } from '@mui/material/styles/overrides';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiSwitch = (palette: Palette): ComponentsOverrides['MuiSwitch'] => {
    return {
        root: {
            '& .MuiSwitch-switchBase': {
                '&.Mui-focusVisible': {
                    outline: `${palette.semantic.colorToggleThumbOff} solid 2px`,
                    backgroundColor: palette.semantic.colorToggleOffFocus,
                },
                '&:hover': { backgroundColor: palette.semantic.colorToggleOffHover },
                '&:active': { backgroundColor: palette.semantic.colorToggleOffPressed },
                '&.Mui-checked': {
                    '&:hover': { backgroundColor: palette.semantic.colorToggleOnHover },
                    '&:active': { backgroundColor: palette.semantic.colorToggleOnPressed },
                    '&.Mui-focusVisible': {
                        outline: `${palette.semantic.colorToggleThumbOn} solid 2px`,
                        backgroundColor: palette.semantic.colorToggleOnFocus,
                    },
                },
            },
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

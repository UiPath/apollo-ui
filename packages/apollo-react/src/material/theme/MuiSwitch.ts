import type { ComponentsOverrides } from '@mui/material/styles/overrides';
import type { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiSwitch = (palette: Palette): ComponentsOverrides['MuiSwitch'] => ({
    root: {
        width: '40px',
        height: '20px',
        padding: '0',
        borderRadius: '10px',
        marginRight: '8px',
        '&:has(.Mui-focusVisible)': {
            outline: `1px solid ${palette.semantic.colorFocusIndicator}`,
            outlineOffset: '1px',
        },
        '& .MuiSwitch-switchBase': {
            padding: '0',
            '&.Mui-focusVisible': {
                outline: 'unset',
                backgroundColor: 'unset',
            },
            '&.Mui-checked': {
                '&.Mui-focusVisible': {
                    outline: 'unset',
                    backgroundColor: 'unset',
                },
            },
        },
        '& .MuiSwitch-track': {
            backgroundColor: palette.semantic.colorForegroundDeEmp,
            opacity: 1,
        },
        '& .MuiSwitch-thumb': {
            backgroundColor: palette.semantic.colorBackground,
            height: '14px',
            width: '14px',
            borderRadius: '10px',
            position: 'relative',
            top: '3px',
            left: '3px',
            boxShadow: 'unset',
        },
        '& .MuiSwitch-switchBase.Mui-disabled + .MuiSwitch-track': {
            backgroundColor: palette.semantic.colorToggleTrackOffDisabled,
            opacity: 1,
        },
        '& .MuiSwitch-switchBase.Mui-disabled .MuiSwitch-thumb': { backgroundColor: palette.semantic.colorForegroundDisable },
        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: palette.semantic.colorToggleThumbOn,
            opacity: 1,
        },
        '& .MuiSwitch-switchBase.Mui-checked .MuiSwitch-thumb': { backgroundColor: palette.semantic.colorBackground },
        // eslint-disable-next-line max-len
        '& .MuiSwitch-switchBase.Mui-checked.Mui-disabled + .MuiSwitch-track': { backgroundColor: palette.semantic.colorBackgroundDisabled },
        // eslint-disable-next-line max-len
        '& .MuiSwitch-switchBase.Mui-checked.Mui-disabled .MuiSwitch-thumb': { backgroundColor: palette.semantic.colorForegroundDisable },
    },
});

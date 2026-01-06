import type { ComponentsOverrides } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiSwitch = (palette: Palette): ComponentsOverrides['MuiSwitch'] => ({
  root: {
    padding: token.Padding.PadXxl,
    width: '60px',
    height: '40px',
    '&:has(.Mui-focusVisible)': {
      outline: `2px solid ${palette.semantic.colorFocusIndicator}`,
      outlineOffset: '2px',
    },
    '& .MuiSwitch-switchBase': {
      padding: token.Padding.PadXl,
      marginLeft: '2px',
      '&.Mui-checked': {
        transform: 'translateX(16px)',
        '&.Mui-focusVisible': {
          outline: 'unset',
          backgroundColor: 'unset',
        },
      },
      '&.Mui-focusVisible': {
        outline: `2px solid ${palette.semantic.colorFocusIndicator} !important`,
        boxShadow: `inset 0 0 0 1px ${palette.semantic.colorBackground}`,
        backgroundColor: 'unset',
      },
    },
    '& .MuiSwitch-track': {
      backgroundColor: palette.semantic.colorForegroundDeEmp,
      opacity: 1,
      borderRadius: '10px',
    },
    '& .MuiSwitch-thumb': {
      backgroundColor: palette.semantic.colorBackground,
      height: '14px',
      width: '14px',
      borderRadius: '10px',
      position: 'relative',
      top: '3px',
      left: '3px',
      boxShadow:
        'rgba(0, 0, 0, 0.12) 0px 2px 1px -1px, rgba(0, 0, 0, 0.14) 0px 1px 1px 0px, rgba(0, 0, 0, 0.2) 0px 1px 3px 0px',
    },
    '& .MuiSwitch-switchBase.Mui-disabled + .MuiSwitch-track': {
      backgroundColor: palette.semantic.colorToggleTrackOffDisabled,
      opacity: 1,
    },
    '& .MuiSwitch-switchBase.Mui-disabled .MuiSwitch-thumb': {
      backgroundColor: palette.semantic.colorForegroundDisable,
      boxShadow:
        'rgba(0, 0, 0, 0.06) 0px 2px 1px 0px, rgba(0, 0, 0, 0.07) 0px 1px 1px 0px, rgba(0, 0, 0, 0.1) 0px 1px 3px 0px !important',
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
      backgroundColor: palette.semantic.colorToggleThumbOn,
      opacity: 1,
    },
    '& .MuiSwitch-switchBase.Mui-checked .MuiSwitch-thumb': {
      backgroundColor: palette.semantic.colorBackground,
    },

    '& .MuiSwitch-switchBase.Mui-checked.Mui-disabled + .MuiSwitch-track': {
      backgroundColor: palette.semantic.colorBackgroundDisabled,
    },

    '& .MuiSwitch-switchBase.Mui-checked.Mui-disabled .MuiSwitch-thumb': {
      backgroundColor: palette.semantic.colorForegroundDisable,
    },
  },
  thumb: {
    boxShadow:
      'rgba(0, 0, 0, 0.12) 0px 2px 1px -1px, rgba(0, 0, 0, 0.14) 0px 1px 1px 0px, rgba(0, 0, 0, 0.2) 0px 1px 3px 0px',
  },
  switchBase: {
    padding: token.Padding.PadXl,
    marginLeft: '2px',
    '&.Mui-checked': { transform: 'translateX(16px)' },
    '&.Mui-focusVisible': {
      outline: `2px solid ${palette.semantic.colorFocusIndicator} !important`,
      boxShadow: `inset 0 0 0 1px ${palette.semantic.colorBackground}`,
    },
  },
  track: { borderRadius: '10px' },
});

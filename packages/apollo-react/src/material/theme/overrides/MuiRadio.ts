import type { ComponentsOverrides } from '@mui/material/styles';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiRadio = (palette: Palette): ComponentsOverrides['MuiRadio'] => ({
  root: {
    '&.Mui-focusVisible': {
      outline: 'auto',
      outlineColor: palette.semantic.colorFocusIndicator,
      backgroundColor: palette.semantic.colorToggleOffFocus,
    },
    '&:hover': { backgroundColor: palette.semantic.colorToggleOffHover },
    '&:active': { backgroundColor: palette.semantic.colorToggleOffPressed },
    '&.Mui-checked': {
      '&:hover': { backgroundColor: palette.semantic.colorToggleOnHover },
      '&:active': { backgroundColor: palette.semantic.colorToggleOnPressed },
      '&.Mui-focusVisible': { backgroundColor: palette.semantic.colorToggleOnFocus },
    },
    '&.Mui-disabled': { color: palette.semantic.colorBackgroundGray },
  },
});

import type { ComponentsOverrides } from '@mui/material/styles';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiCheckbox = (palette: Palette): ComponentsOverrides['MuiCheckbox'] => ({
  root: {
    width: '40px',
    height: '40px',
    '&.Mui-focusVisible': {
      outline: `2px solid ${palette.semantic.colorFocusIndicator}`,
      boxShadow: `inset 0 0 0 1px ${palette.semantic.colorBackground}`,
      backgroundColor: palette.semantic.colorToggleOffFocus,
    },
    '&:hover': { backgroundColor: palette.semantic.colorToggleOffHover },
    '&:active': { backgroundColor: palette.semantic.colorToggleOffPressed },
    '&.Mui-disabled': { color: palette.semantic.colorBackgroundGray },
    '&.Mui-checked': {
      '&:hover': { backgroundColor: palette.semantic.colorToggleOnHover },
      '&:active': { backgroundColor: palette.semantic.colorToggleOnPressed },
      '&.Mui-focusVisible': { backgroundColor: palette.semantic.colorToggleOnFocus },
    },
    '&.Mui-indeterminate': {
      '&:hover': { backgroundColor: palette.semantic.colorToggleOnHover },
      '&:active': { backgroundColor: palette.semantic.colorToggleOnPressed },
      '&.Mui-focusVisible': { backgroundColor: palette.semantic.colorToggleOnFocus },
    },
  },
});

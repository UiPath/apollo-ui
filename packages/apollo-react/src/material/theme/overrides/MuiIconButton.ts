import type { ComponentsOverrides } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiIconButton = (palette: Palette): ComponentsOverrides['MuiIconButton'] => ({
  root: {
    padding: token.Padding.PadL,
    '&&:hover': { backgroundColor: palette.semantic.colorIconButtonHover },
    '&&:focus-visible': { boxShadow: `inset 0 0 0 1px ${palette.semantic.colorBackground}` },
    '&.MuiIconButton-colorPrimary:not(.Mui-disabled)': { color: palette.semantic.colorPrimary },
    '&.MuiIconButton-colorSecondary:not(.Mui-disabled)': {
      color: palette.semantic.colorIconDefault,
      '&&:hover': { backgroundColor: palette.semantic.colorIconButtonHover },
      '&&:focus-visible': {
        backgroundColor: palette.semantic.colorIconButtonHover,
        outline: `${palette.semantic.colorFocusIndicator} solid 2px !important`,
      },
      '&&:active': { backgroundColor: palette.semantic.colorIconButtonPressed },
    },
    '&.MuiIconButton-sizeSmall': {
      width: token.Spacing.SpacingL,
      height: token.Spacing.SpacingL,
    },
    '&.MuiIconButton-sizeMedium': {
      width: token.Spacing.SpacingXl,
      height: token.Spacing.SpacingXl,
    },
    '&.MuiIconButton-sizeLarge': {
      width: token.Spacing.SpacingXxl,
      height: token.Spacing.SpacingXxl,
    },
    '&.Mui-disabled': { color: palette.semantic.colorForegroundDisable },
  },
});

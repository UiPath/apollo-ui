import type { ComponentsOverrides } from '@mui/material/styles';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiMenu = (palette: Palette): ComponentsOverrides['MuiMenu'] => ({
  paper: {
    backgroundColor: palette.semantic.colorBackground,
    boxShadow:
      '0px 3px 5px -1px rgba(0, 0, 0, 0.20), 0px 6px 10px 0px rgba(0, 0, 0, 0.14), 0px 1px 18px 0px rgba(0, 0, 0, 0.12)',
    borderRadius: '3px',
  },
  list: { '&.MuiList-padding': { padding: '0px' } },
});

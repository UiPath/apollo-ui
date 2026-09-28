import type { ComponentsOverrides } from '@mui/material/styles';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiAccordion = (_palette: Palette): ComponentsOverrides['MuiAccordion'] => ({
  root: {
    '&.MuiPaper-root': { boxShadow: 'unset' },
  },
});

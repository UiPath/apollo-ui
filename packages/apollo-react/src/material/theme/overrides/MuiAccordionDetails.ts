import type { ComponentsOverrides } from '@mui/material/styles';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiAccordionDetails = (
  _palette: Palette
): ComponentsOverrides['MuiAccordionDetails'] => ({
  root: { padding: 'unset' },
});

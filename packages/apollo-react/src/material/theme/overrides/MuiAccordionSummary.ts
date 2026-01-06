import type { ComponentsOverrides } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiAccordionSummary = (
  _palette: Palette
): ComponentsOverrides['MuiAccordionSummary'] => ({
  root: {
    ':hover, :focus': { backgroundColor: 'transparent' },
    padding: `${token.Padding.PadXl} ${token.Padding.PadXxxl}`,
    minHeight: '40px',
    '&.Mui-expanded': { minHeight: '40px' },
  },
  content: {
    margin: '0px',
    '&.Mui-expanded': { margin: '0px' },
  },
});

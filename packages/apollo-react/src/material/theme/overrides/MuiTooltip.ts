import type { ComponentsOverrides } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiTooltip = (palette: Palette): ComponentsOverrides['MuiTooltip'] => ({
  tooltip: {
    fontSize: token.FontFamily.FontSSize,
    lineHeight: token.FontFamily.FontSLineHeight,
    padding: `${token.Padding.PadL} ${token.Padding.PadXxl}`,
    borderRadius: '3px',
    fontWeight: token.FontFamily.FontWeightSemibold,
    background: palette.semantic.colorBackgroundInverse,
    backgroundColor: palette.semantic.colorBackgroundInverse,
    color: palette.semantic.colorForegroundInverse,
    boxShadow: token.Shadow.ShadowTooltipElevation,

    '& .container': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      '&-column': {
        flexDirection: 'column',
        alignItems: 'flex-start',
      },
      '& .spacer': { marginLeft: '4px' },
      '& .icon': {
        marginLeft: '4px',
        fontSize: token.FontFamily.FontLSize,
        lineHeight: token.FontFamily.FontSLineHeight,
        fontWeight: 'normal',
        color: palette.semantic.colorBackgroundGray,
      },
      '& p, .text': {
        fontWeight: 'bold',
        margin: '0',
      },
      '& p, .body': {
        fontWeight: 'normal',
        margin: '0',
      },
      '& .header': { fontWeight: 'bold' },
    },
  },
});

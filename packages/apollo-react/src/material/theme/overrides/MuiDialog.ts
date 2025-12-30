import { alpha } from '@mui/material';
import type { ComponentsOverrides } from '@mui/material/styles';
import token, { FontFamily } from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiDialog = (palette: Palette): ComponentsOverrides['MuiDialog'] => ({
  root: {
    '&.alert': {
      '& .MuiDialog-paper': { width: '412px' },

      '& .container': {
        display: 'flex',
        justifyItems: 'baseline',
      },

      '& .alert-icon': {
        width: '40px',
        height: '40px',
        marginRight: '20px',
      },

      '& .title': { marginTop: '10px' },

      '& .alert-button': { height: '32px' },

      '& .warning': { color: palette.semantic.colorWarningIcon },
      '& .info': {
        // @Shaun: clarification : we are getting token colorInfoIcon
        color: palette.semantic.colorInfoForeground,
      },
      '& .error': { color: palette.semantic.colorErrorIcon },
      '& .success': { color: palette.semantic.colorSuccessIcon },

      '& .MuiDialogTitle-root': {
        '& .MuiTypography-h6': {
          fontFamily: FontFamily.FontNormal,
          fontStyle: 'normal',
          fontWeight: token.FontFamily.FontWeightSemibold,
          fontSize: token.FontFamily.FontHeader4Size,
          lineHeight: token.FontFamily.FontHeader4LineHeight,
          color: palette.semantic.colorForeground,
        },
        padding: `0px 0px ${token.Padding.PadXxxl} 0px`,
      },

      '& .MuiDialogContent-root': {
        '& .MuiDialogContentText-root': {
          fontFamily: FontFamily.FontNormal,
          fontStyle: 'normal',
          fontWeight: 'normal',
          fontSize: token.FontFamily.FontMSize,
          lineHeight: token.FontFamily.FontMLineHeight,
          color: palette.semantic.colorForeground,
        },
        padding: `0px 0px ${token.Padding.PadXxxl} 0px`,
      },
    },

    '& .MuiBackdrop-root': { backgroundColor: 'transparent' },
    '& .MuiDialog-paper': {
      boxShadow: token.Shadow.ShadowDialogElevation,
      background: palette.semantic.colorBackgroundRaised,
      borderRadius: '3px',
      padding: '24px',
      minHeight: '224px',
    },
    '& .MuiDialogTitle-root': {
      '& .MuiTypography-h6': {
        fontFamily: FontFamily.FontNormal,
        fontStyle: 'normal',
        fontWeight: token.FontFamily.FontWeightSemibold,
        fontSize: token.FontFamily.FontHeader4Size,
        lineHeight: token.FontFamily.FontHeader4LineHeight,
        color: palette.semantic.colorForeground,
      },
      padding: `0px 0px ${token.Padding.PadXxxl} 0px`,
    },
    '& .MuiDialogContent-root': {
      '& .MuiDialogContentText-root': {
        fontFamily: FontFamily.FontNormal,
        fontStyle: 'normal',
        fontWeight: 'normal',
        fontSize: token.FontFamily.FontMSize,
        lineHeight: token.FontFamily.FontMLineHeight,
        color: palette.semantic.colorForeground,
        marginBottom: '12px',
      },
      padding: `0px 0px ${token.Padding.PadXxxl} 0px`,
    },
    '& .MuiDialogActions-root': { padding: '0px' },

    // custom x
    '& .close': {
      float: 'right',
      marginTop: '-8px',
      marginRight: '-8px',
      color: palette.semantic.colorIconDefault,
      width: token.Icon.IconXs,
      height: token.Icon.IconXs,

      '&:hover': {
        backgroundColor: alpha(palette.semantic.colorPrimary, 0.1),
        borderRadius: '3px',
      },
    },
  },
});

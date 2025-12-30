import token from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiAlert = (palette: Palette) => ({
  root: {
    color: palette.semantic.colorForegroundInverse,
    backgroundColor: palette.semantic.colorBackgroundInverse,
    padding: '8px 8px 8px 20px',
    minWidth: '320px',
    alignItems: 'center',
    boxShadow: token.Shadow.ShadowDp8,
    '&.MuiAlert-standardWarning, &.MuiAlert-standardError, &.MuiAlert-standardInfo, &.MuiAlert-standardSuccess':
      {
        color: palette.semantic.colorForegroundInverse,
        backgroundColor: palette.semantic.colorBackgroundInverse,
      },
    '&.MuiAlert-standardWarning > .MuiAlert-icon': {
      color: palette.semantic.colorWarningIconInverse,
    },
    '&.MuiAlert-standardInfo > .MuiAlert-icon': { color: palette.semantic.colorInfoIconInverse },
    '&.MuiAlert-standardError > .MuiAlert-icon': { color: palette.semantic.colorErrorIconInverse },
    '&.MuiAlert-standardSuccess > .MuiAlert-icon': {
      color: palette.semantic.colorSuccessIconInverse,
    },
    '& .MuiAlert-icon': {
      fontSize: '36px',
      padding: 0,
      marginRight: '20px',
      '& .MuiSvgIcon-root': { fontSize: '36px' },
    },
    '& .MuiAlert-action': {
      alignItems: 'flex-start',
      paddingLeft: '32px',
      paddingRight: '6px',
      height: '36px',
      marginTop: '-16px',
      '& .MuiSvgIcon-root': {
        width: '16px',
        height: '16px',
        color: palette.semantic.colorIconInvertedDefault,
      },
      '& .MuiIconButton-root.MuiIconButton-root:hover': { background: 'none' },
      '& .MuiIconButton-root.MuiIconButton-root:focus': { background: 'none' },
      '& .MuiIconButton-sizeSmall': { padding: '3px' },
    },
    '& .MuiAlert-message': {
      padding: '12px 0 12px 0',
      fontSize: token.FontFamily.FontMSize,
      lineHeight: token.FontFamily.FontMLineHeight,
      fontWeight: 'normal',
      maxWidth: '491px',
    },

    '& .alert-container': {
      display: 'flex',
      flexDirection: 'column',
    },
    '& .alert-bottom-button': {
      background: 'none',
      color: palette.semantic.colorForegroundInverse,
      fontSize: token.FontFamily.FontMSize,
      lineHeight: token.FontFamily.FontMLineHeight,
      borderRadius: 0,
      minWidth: '114px',
      '&.MuifocusVisible': { border: `1px solid ${palette.semantic.colorBorder}` },
    },
    '& .alert-top-button': {
      background: 'none',
      color: palette.semantic.colorForegroundInverse,
      fontSize: token.FontFamily.FontMSize,
      lineHeight: token.FontFamily.FontMLineHeight,
      borderRadius: 0,
      borderBottom: `1px solid ${palette.semantic.colorBorderDeEmp}`,
      minWidth: '114px',
      '&.MuifocusVisible': { border: `1px solid ${palette.semantic.colorBorder}` },
    },

    '&.toast-buttons': {
      '& .MuiAlert-action': {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderLeft: `1px solid ${palette.semantic.colorBorderDeEmp}`,
        marginBottom: '-8px',
        marginRight: '-12px',
        marginTop: '-8px',
        paddingLeft: 0,
        marginLeft: '32px',
      },
    },
  },
});

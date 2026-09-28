import type { ComponentsOverrides } from '@mui/material/styles';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

export const MuiTextField = (palette: Palette): ComponentsOverrides['MuiTextField'] => ({
  root: {
    '& .MuiFormHelperText-contained': { margin: '4px 0 0 0' },
    '& .MuiFormHelperText-contained &&:not(.Mui-error)': {
      color: palette.semantic.colorForegroundDeEmp,
    },
    '&.MuiFormHelperText-root .Mui-error': { color: palette.semantic.colorErrorText },
    '& .MuiInputLabel-root': {
      transform: 'none',
      position: 'relative',
    },
    '& .MuiInputBase-root': {
      backgroundColor: palette.semantic.colorBackground,
      '&.Mui-error .MuiOutlinedInput-notchedOutline': {
        borderColor: `${palette.semantic.colorErrorText} !important`,
        borderWidth: '2px',
      },
      borderRadius: '3px',
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: palette.semantic.colorFocusIndicator,
      },
      '&.MuiInputBase-input': { color: palette.semantic.colorForeground },
    },
    '& .MuiInputBase-root:has(input[readonly])': {
      backgroundColor: palette.semantic.colorBackgroundSecondary,
      '& .MuiInputBase-input': { cursor: 'default' },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: palette.semantic.colorSelectionIndicator,
        borderWidth: '2px',
      },
    },
    '&.ap-omit-start-adornment-spacing': {
      '& .MuiInputAdornment-positionStart': { marginRight: 'unset' },
      '& .MuiInputBase-inputAdornedStart': { paddingLeft: '2px' },
    },
  },
});

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
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: palette.semantic.colorFocusIndicator,
      },
    },
    '& .MuiInputBase-root:has(input[readonly])': {
      '& .MuiInputBase-input': { cursor: 'default' },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: '1px' },
    },
    '&.ap-omit-start-adornment-spacing': {
      '& .MuiInputAdornment-positionStart': { marginRight: 'unset' },
      '& .MuiInputBase-inputAdornedStart': { paddingLeft: '2px' },
    },
  },
});

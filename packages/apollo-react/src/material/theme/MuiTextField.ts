import { ComponentsOverrides } from '@mui/material/styles/overrides';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiTextField = (palette: Palette): ComponentsOverrides['MuiTextField'] => {
    return {
        root: {
            '& .MuiFormHelperText-contained': { margin: '4px 0 0 0' },
            '& .MuiFormHelperText-contained &&:not(.Mui-error)': { color: palette.semantic.colorForegroundDeEmp },
            '&.MuiFormHelperText-root .Mui-error': { color: palette.semantic.colorErrorText },
            '& .MuiInputLabel-root': {
                transform: 'none',
                position: 'relative',
            },
            '& .MuiInputBase-root:has(input[readonly])': {
                '& .MuiInputBase-input': {
                    paddingLeft: 0,
                    paddingRight: 0,
                    cursor: 'default',
                },
                '& fieldset': { border: 0 },
            },
            '&.ap-omit-start-adornment-spacing': {
                '& .MuiInputAdornment-positionStart': { marginRight: 'unset' },
                '& .MuiInputBase-inputAdornedStart': { paddingLeft: '2px' },
            },
        },
    };
};

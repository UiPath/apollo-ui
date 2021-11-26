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
        },
    };
};

import { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiInputLabel = (palette: Palette): ComponentsOverrides['MuiInput'] => {
    return {
        root: {
            margin: `${token.Padding.PadL} 0`,
            fontWeight: token.FontFamily.FontWeightSemibold,
            fontSize: token.FontFamily.FontMSize,
            lineHeight: token.FontFamily.FontMLineHeight,
            color: palette.semantic.colorForegroundDeEmp,
            '&.select-label': { '& + .MuiInputBase-root > .MuiOutlinedInput-notchedOutline': { top: '0px !important' } },
            '&.Mui-error': { color: palette.semantic.colorErrorText },
            '& + .MuiInputBase-root > .MuiOutlinedInput-notchedOutline': { top: '-5px !important' },
            '&.Mui-focused': { color: palette.semantic.colorForegroundDeEmp },
        },
    };
};

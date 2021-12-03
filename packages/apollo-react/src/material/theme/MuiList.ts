import { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiList = (palette: Palette): ComponentsOverrides['MuiList'] => {
    return {
        root: {
            boxShadow: token.Shadow.ShadowDp8,
            borderRadius: '3px',
            background: palette.semantic.colorBackgroundRaised,
            paddingTop: '0',
            '&.MuiList-padding': { paddingTop: '8px' },
            '& .header': {
                color: palette.semantic.colorForeground,
                fontStyle: 'normal',
                fontWeight: token.FontFamily.FontWeightSemibold,
                fontSize: token.FontFamily.FontMSize,
                lineHeight: token.FontFamily.FontMLineHeight,
            },
            '&:hover': {
                backgroundColor: `rgba(${palette.semantic.colorPrimary}, 0.1) !important`,
                color: palette.semantic.colorForegroundDeEmp,
            },
            '&:focus': {
                backgroundColor: `rgba(${palette.semantic.colorPrimary}, 0.15) !important`,
                color: palette.semantic.colorForegroundDeEmp,
            },
        },
    };
};

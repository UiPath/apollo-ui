import { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiChip = (palette: Palette): ComponentsOverrides['MuiChip'] => {
    return {
        deletable: { '&:focus': { backgroundColor: palette.semantic.colorBackgroundGrayEmp } },
        root: {
            paddingLeft: token.Padding.PadL,
            paddingRight: token.Padding.PadL,
            paddingTop: token.Padding.PadXs,
            paddingBottom: token.Padding.PadXs,
            minWidth: '32px',
            fontSize: token.FontFamily.FontMSize,
            lineHeight: token.FontFamily.FontMLineHeight,
            fontWeight: token.FontFamily.FontWeightSemibold,
            color: palette.semantic.colorForeground,
            backgroundColor: palette.semantic.colorBackgroundGray,
            '&:hover': { backgroundColor: palette.semantic.colorBackgroundGrayEmp },
            '&.icon': {
                color: palette.semantic.colorForeground,
                paddingLeft: '0px',
                paddingRight: '0px',
            },

            // Mini Chips
            '&.warning-mini': {
                paddingLeft: '0px',
                paddingRight: '0px',
                height: '16px',
                fontSize: token.FontFamily.FontXsSize,
                lineHeight: token.FontFamily.FontXsLineHeight,
                fontStyle: 'normal',
                fontWeight: token.FontFamily.FontWeightSemibold,
                color: palette.semantic.colorWarningText,
                background: palette.semantic.colorWarningBackground,
            },

            '&.mini': {
                paddingLeft: '0px',
                paddingRight: '0px',
                height: '16px',
                fontSize: token.FontFamily.FontXsSize,
                lineHeight: token.FontFamily.FontXsLineHeight,
                fontStyle: 'normal',
                fontWeight: token.FontFamily.FontWeightSemibold,
                color: palette.semantic.colorForeground,
                background: palette.semantic.colorBackgroundSecondary,
            },

            '&.info-mini': {
                paddingLeft: '0px',
                paddingRight: '0px',
                height: '16px',
                fontSize: token.FontFamily.FontXsSize,
                lineHeight: token.FontFamily.FontXsLineHeight,
                fontStyle: 'normal',
                fontWeight: token.FontFamily.FontWeightSemibold,
                color: palette.semantic.colorInfoForeground,
                background: palette.semantic.colorInfoBackground,
            },

            '&.success-mini': {
                paddingLeft: '0px',
                paddingRight: '0px',
                height: '16px',
                fontSize: token.FontFamily.FontXsSize,
                lineHeight: token.FontFamily.FontXsLineHeight,
                fontStyle: 'normal',
                fontWeight: token.FontFamily.FontWeightSemibold,
                color: palette.semantic.colorSuccessText,
                background: palette.semantic.colorSuccessBackground,
            },

            '&.error-mini': {
                paddingLeft: '0px',
                paddingRight: '0px',
                height: '16px',
                fontSize: token.FontFamily.FontXsSize,
                lineHeight: token.FontFamily.FontXsLineHeight,
                fontStyle: 'normal',
                fontWeight: token.FontFamily.FontWeightSemibold,
                color: palette.semantic.colorErrorText,
                background: palette.semantic.colorErrorBackground,
            },

            '& .MuiChip-icon, .MuiChip-deleteIcon': {
                color: palette.semantic.colorForeground,
                width: '16px',
                height: 'auto',
            },
            '& .MuiChip-deleteIcon:hover': { color: palette.semantic.colorForeground },
            '&.warning': {
                color: palette.semantic.colorWarningText,
                background: palette.semantic.colorWarningBackground,
                '&:hover': {
                    color: palette.semantic.colorWarningText,
                    background: palette.semantic.colorWarningBackground,
                },
            },
            '&.success': {
                color: palette.semantic.colorSuccessText,
                background: palette.semantic.colorSuccessBackground,
                '&:hover': {
                    color: palette.semantic.colorSuccessText,
                    background: palette.semantic.colorSuccessBackground,
                },
            },
            '&.info': {
                color: palette.semantic.colorInfoForeground,
                background: palette.semantic.colorInfoBackground,
                '&:hover': {
                    color: palette.semantic.colorInfoForeground,
                    background: palette.semantic.colorInfoBackground,
                },
            },
            '&.error': {
                color: palette.semantic.colorErrorText,
                background: palette.semantic.colorErrorBackground,
                '&:hover': {
                    color: palette.semantic.colorErrorText,
                    background: palette.semantic.colorErrorBackground,
                },
            },
        },
    };
};

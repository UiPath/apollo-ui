import { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiChip = (palette: Palette): ComponentsOverrides['MuiChip'] => {
    return {
        deletable: { '&:focus': { backgroundColor: palette.semantic.colorBackgroundGrayEmp } },
        root: {
            paddingLeft: token.Padding.PadL,
            paddingRight: token.Padding.PadL,
            minWidth: '32px',
            fontSize: token.FontFamily.FontMSize,
            lineHeight: token.FontFamily.FontMLineHeight,
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
                borderWidth: token.Border.BorderThickS,
                borderColor: palette.semantic.colorWarningIcon,
                color: palette.semantic.colorWarningText,
                background: palette.semantic.colorWarningBackground,
                '&:hover': {
                    borderColor: palette.semantic.colorWarningIcon,
                    color: palette.semantic.colorWarningText,
                    background: palette.semantic.colorWarningBackground,
                },
            },

            '&.mini': {
                paddingLeft: '0px',
                paddingRight: '0px',
                height: '16px',
                fontSize: token.FontFamily.FontXsSize,
                lineHeight: token.FontFamily.FontXsLineHeight,
                fontStyle: 'normal',
                fontWeight: token.FontFamily.FontWeightSemibold,
                borderWidth: token.Border.BorderThickS,
                borderColor: palette.semantic.colorForeground,
                color: palette.semantic.colorForeground,
                background: palette.semantic.colorBackgroundGray,
                '&:hover': {
                    borderColor: palette.semantic.colorForeground,
                    color: palette.semantic.colorForeground,
                    background: palette.semantic.colorBackgroundGray,
                },
            },

            '&.info-mini': {
                paddingLeft: '0px',
                paddingRight: '0px',
                height: '16px',
                fontSize: token.FontFamily.FontXsSize,
                lineHeight: token.FontFamily.FontXsLineHeight,
                fontStyle: 'normal',
                fontWeight: token.FontFamily.FontWeightSemibold,
                borderWidth: token.Border.BorderThickS,
                borderColor: palette.semantic.colorInfoForeground,
                color: palette.semantic.colorInfoForeground,
                background: palette.semantic.colorInfoBackground,
                '&:hover': {
                    borderColor: palette.semantic.colorInfoForeground,
                    color: palette.semantic.colorInfoForeground,
                    background: palette.semantic.colorInfoBackground,
                },
            },

            '&.success-mini': {
                paddingLeft: '0px',
                paddingRight: '0px',
                height: '16px',
                fontSize: token.FontFamily.FontXsSize,
                lineHeight: token.FontFamily.FontXsLineHeight,
                fontStyle: 'normal',
                fontWeight: token.FontFamily.FontWeightSemibold,
                borderWidth: token.Border.BorderThickS,
                borderColor: palette.semantic.colorSuccessText,
                color: palette.semantic.colorSuccessText,
                background: palette.semantic.colorSuccessBackground,
                '&:hover': {
                    borderColor: palette.semantic.colorSuccessText,
                    color: palette.semantic.colorSuccessText,
                    background: palette.semantic.colorSuccessBackground,
                },
            },

            '&.error-mini': {
                paddingLeft: '0px',
                paddingRight: '0px',
                height: '16px',
                fontSize: token.FontFamily.FontXsSize,
                lineHeight: token.FontFamily.FontXsLineHeight,
                fontStyle: 'normal',
                fontWeight: token.FontFamily.FontWeightSemibold,
                borderWidth: token.Border.BorderThickS,
                borderColor: palette.semantic.colorErrorText,
                color: palette.semantic.colorErrorText,
                background: palette.semantic.colorErrorBackground,
                '&:hover': {
                    borderColor: palette.semantic.colorErrorText,
                    color: palette.semantic.colorErrorText,
                    background: palette.semantic.colorErrorBackground,
                },
            },

            '& .MuiChip-icon, .MuiChip-deleteIcon': {
                color: palette.semantic.colorForeground,
                width: '14px',
                height: 'auto',
            },
            '& .MuiChip-deleteIcon:hover': { color: palette.semantic.colorForeground },
            '&.warning': {
                paddingLeft: token.Padding.PadL,
                paddingRight: token.Padding.PadL,
                color: palette.semantic.colorWarningText,
                background: palette.semantic.colorWarningBackground,
                fontSize: token.FontFamily.FontSSize,
                lineHeight: token.FontFamily.FontSLineHeight,
                '&:hover': {
                    color: palette.semantic.colorWarningText,
                    background: palette.semantic.colorWarningBackground,
                },
            },
            '&.success': {
                paddingLeft: token.Padding.PadL,
                paddingRight: token.Padding.PadL,
                color: palette.semantic.colorSuccessText,
                background: palette.semantic.colorSuccessBackground,
                fontSize: token.FontFamily.FontSSize,
                lineHeight: token.FontFamily.FontSLineHeight,
                '&:hover': {
                    color: palette.semantic.colorSuccessText,
                    background: palette.semantic.colorSuccessBackground,
                },
            },
            '&.info': {
                paddingLeft: token.Padding.PadL,
                paddingRight: token.Padding.PadL,
                color: palette.semantic.colorInfoForeground,
                background: palette.semantic.colorInfoBackground,
                fontSize: token.FontFamily.FontSSize,
                lineHeight: token.FontFamily.FontSLineHeight,
                '&:hover': {
                    color: palette.semantic.colorInfoForeground,
                    background: palette.semantic.colorInfoBackground,
                },
            },
            '&.error': {
                paddingLeft: token.Padding.PadL,
                paddingRight: token.Padding.PadL,
                color: palette.semantic.colorErrorText,
                background: palette.semantic.colorErrorBackground,
                fontSize: token.FontFamily.FontSSize,
                lineHeight: token.FontFamily.FontSLineHeight,
                '&:hover': {
                    color: palette.semantic.colorErrorText,
                    background: palette.semantic.colorErrorBackground,
                },
            },
        },
    };
};

import { alpha } from '@mui/material';
import { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiListItemButton = (palette: Palette): ComponentsOverrides['MuiListItemButton'] => {
    return {
        root: {
            fontStyle: 'normal',
            fontWeight: 'normal',
            fontSize: token.FontFamily.FontMSize,
            lineHeight: token.FontFamily.FontMLineHeight,
            color: palette.semantic.colorForegroundDeEmp,
            '&.header': {
                color: palette.semantic.colorForeground,
                fontWeight: token.FontFamily.FontWeightSemibold,
                padding: `${token.Padding.PadXl} ${token.Padding.PadXxxl} ${token.Padding.PadXl} ${token.Padding.PadXxxl}`,
                fontStyle: 'normal',
                fontFamily: token.FontFamily.FontNormal,
                fontSize: token.FontFamily.FontMSize,
                lineHeight: token.FontFamily.FontMLineHeight,
            },
            '&.notification-header': {
                padding: `${token.Padding.PadXxl} ${token.Padding.PadXxxl}`,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: palette.semantic.colorForeground,
                fontFamily: token.FontFamily.FontNormal,
                fontSize: token.FontFamily.FontLSize,
                lineHeight: token.FontFamily.FontLLineHeight,
                fontWeight: token.FontFamily.FontWeightSemibold,
            },
            '& .notification-bubble': {
                width: '8px',
                height: '8px',
                background: palette.semantic.colorForegroundHigh,
                borderRadius: '100%',
                marginLeft: '24px',
                marginBottom: '16px',
            },
            '&.notification-item': {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
            },
            '& .notification-title': {
                fontStyle: 'normal',
                fontFamily: token.FontFamily.FontNormal,
                fontWeight: 'normal',
                fontSize: token.FontFamily.FontMSize,
                lineHeight: token.FontFamily.FontMLineHeight,
                color: palette.semantic.colorForeground,
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                marginTop: '6px',
                marginBottom: '4px',
            },
            '& .notification-subtitle': {
                fontStyle: 'normal',
                fontFamily: token.FontFamily.FontNormal,
                fontWeight: 'normal',
                fontSize: token.FontFamily.FontSSize,
                lineHeight: token.FontFamily.FontSLineHeight,
                color: palette.semantic.colorForegroundDeEmp,
                marginBottom: '6px',
            },
            '& .notification-container': {
                fontFamily: token.FontFamily.FontNormal,
                marginRight: 'auto',
            },
            '&.footer': {
                padding: `${token.Padding.PadXl} ${token.Padding.PadXxxl}`,
                textAlign: 'center',
                justifyContent: 'center',
                '& a': {
                    fontFamily: token.FontFamily.FontNormal,
                    fontSize: token.FontFamily.FontMSize,
                    lineHeight: token.FontFamily.FontMLineHeight,
                },
            },
            '&:hover': {
                backgroundColor: palette.semantic.colorHover,
                color: palette.semantic.colorForegroundDeEmp,
            },
            '&:focus': {
                backgroundColor: alpha(palette.semantic.colorPrimary, 0.1),
                color: palette.semantic.colorForegroundDeEmp,
            },
            '&.Mui-selected.Mui-selected.Mui-selected': {
                boxShadow: `inset 4px 0px 0px ${palette.semantic.colorForegroundHigh}`,
                backgroundColor: alpha(palette.semantic.colorForegroundHigh, 0.1),
                color: palette.semantic.colorForegroundDeEmp,
            },
            '&.Mui-selected:hover': {
                boxShadow: `inset 4px 0px 0px ${palette.semantic.colorForegroundHigh}`,
                backgroundColor: alpha(palette.semantic.colorForegroundHigh, 0.15),
                color: palette.semantic.colorForegroundDeEmp,
            },
            '&.MuiListItemButton-divider': { borderColor: palette.semantic.colorBorderDeEmp },
        },
    };
};

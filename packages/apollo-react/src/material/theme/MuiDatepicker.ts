import type { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';
import type { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiDatepicker = (palette: Palette): ComponentsOverrides['MuiPopper'] => ({
    root: {
        '&.MuiPickersPopper-root': {
            '.MuiPickersPopper-paper': {
                backgroundColor: palette.semantic.colorBackgroundRaised,
                backgroundImage: 'unset',

                '& .MuiDayPicker-header': {
                    maxHeight: token.Spacing.SpacingXl,
                    borderBottom: `1px solid ${palette.semantic.colorBorderDeEmp}`,
                    marginBottom: token.Spacing.SpacingXs,
                },

                '& .MuiPickersDay-root': {
                    fontWeight: token.FontFamily.FontWeightSemibold,
                    color: palette.semantic.colorForeground,
                    fontSize: token.FontFamily.FontMSize,

                    '&:not(:hover):not(.Mui-selected)': { backgroundColor: palette.semantic.colorBackgroundRaised },
                    '&.Mui-selected': {
                        backgroundColor: palette.semantic.colorPrimary,
                        color: palette.semantic.colorForegroundInverse,
                    },
                },
            },
        },
    },
});

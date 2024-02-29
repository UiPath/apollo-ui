import type { ComponentsOverrides } from '@mui/material/styles/overrides';
import token from '@uipath/apollo-core/lib';
import type { Palette } from '@uipath/apollo-core/lib/jss/palette';

export const MuiDatepicker = (palette: Palette): ComponentsOverrides['MuiPopper'] => ({
    root: {
        '&.MuiPickersPopper-root': {
            '.MuiPickersPopper-paper': {
                backgroundColor: palette.semantic.colorBackgroundRaised,
                backgroundImage: 'unset',

                '& .MuiDateCalendar-root': {
                    userSelect: 'none',
                    width: '310px',
                    height: 'auto',
                    maxHeight: 'none',

                    // Set the sizes and spacing as CSS Variables
                    '--date-picker-day-size': token.Spacing.SpacingXl,
                    '--date-picker-weeks-rows-gap': token.Spacing.SpacingXs,
                    '--date-picker-days-gap': token.Spacing.SpacingXs,
                },

                // Adding dynamic popup height based on the count of day rows with smooth transition
                '& .MuiPickersSlideTransition-root': {
                    '--date-picker-day-rows-count': '4',

                    minHeight: 0,
                    overflow: 'hidden',
                    marginBottom: token.Spacing.SpacingBase,

                    // [START] Dynamic height animation support based on weeks rows count

                    // Height change transition/animation
                    transition: '0.2s all',

                    // Calculate the height based on the number of rows visible
                    height: `calc(
                        (var(--date-picker-day-rows-count) * var(--date-picker-day-size)) +
                        ((var(--date-picker-day-rows-count) - 1) * var(--date-picker-weeks-rows-gap))
                    )`,

                    // Updating the number of rows to dynamically update the height
                    '&:has(div[aria-rowindex="5"])': { '--date-picker-day-rows-count': '5' },
                    '&:has(div[aria-rowindex="6"])': { '--date-picker-day-rows-count': '6' },
                },

                // Header container - Month Name + Arrows
                '& .MuiPickersCalendarHeader-root': { paddingRight: '14px' },

                // Month Name Dropdown Icon
                '& .MuiPickersCalendarHeader-switchViewButton': {
                    width: token.Spacing.SpacingL,
                    height: token.Spacing.SpacingL,
                    padding: 0,
                },

                // Day Names Header
                '& .MuiDayCalendar-header': {
                    maxHeight: 'var(--date-picker-day-size)',
                    borderBottom: `1px solid ${palette.semantic.colorBorderDeEmp}`,
                    marginBottom: token.Spacing.SpacingS,
                    gap: token.Spacing.SpacingXs,
                },

                // Day Name
                '& .MuiDayCalendar-weekDayLabel': {
                    width: 'var(--date-picker-day-size)',
                    height: 'var(--date-picker-day-size)',
                    margin: 0,
                },

                // Month - Week Rows Container
                '& .MuiDayCalendar-monthContainer': {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--date-picker-weeks-rows-gap)',
                },

                // Week Row
                '& .MuiDayCalendar-weekContainer': {
                    gap: 'var(--date-picker-days-gap)',
                    margin: 0,
                },

                // Day
                '& .MuiPickersDay-root': {
                    width: 'var(--date-picker-day-size)',
                    height: 'var(--date-picker-day-size)',
                    fontWeight: token.FontFamily.FontWeightSemibold,
                    color: palette.semantic.colorForeground,
                    fontSize: token.FontFamily.FontMSize,
                    margin: 0,

                    // Today
                    '&.MuiPickersDay-today': { borderColor: palette.semantic.colorBorder },

                    // Disabled / Unselectable day
                    '&.Mui-disabled': { color: palette.semantic.colorForegroundDisable },

                    // Selected Day
                    '&.Mui-selected': {
                        backgroundColor: palette.semantic.colorPrimary,
                        color: palette.semantic.colorForegroundInverse,
                    },
                },
            },

            '&[data-popper-placement^="top"] .MuiPickersPopper-paper .MuiPickersSlideTransition-root': {
                // If the popup is opened above the input, delay the height change transition so
                // the arrow buttons don't jump around while navigating quickly between months.
                transitionDelay: '0.7s',
            },
        },
    },
});

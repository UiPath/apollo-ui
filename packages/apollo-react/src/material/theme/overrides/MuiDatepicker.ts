import type { ComponentsOverrides } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

const dayFocusIndicatorSize = 3;

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

          // Move the container up to show the day item focus indicator without clipping
          marginTop: `-${dayFocusIndicatorSize}px`,

          minHeight: 0,
          overflow: 'hidden',
          marginBottom: token.Spacing.SpacingBase,

          // [START] Dynamic height animation support based on weeks rows count

          // Height change transition/animation
          transition: '0.2s all',

          // Calculate the height based on the number of rows visible, their gaps,
          // and the focus indicator size
          height: `calc(
                        (var(--date-picker-day-rows-count) * var(--date-picker-day-size)) +
                        ((var(--date-picker-day-rows-count) - 1) * var(--date-picker-weeks-rows-gap)) +
                        ${dayFocusIndicatorSize * 2}px
                    )`,

          // Updating the number of rows to dynamically update the height
          '&:has(div[aria-rowindex="5"])': { '--date-picker-day-rows-count': '5' },
          '&:has(div[aria-rowindex="6"])': { '--date-picker-day-rows-count': '6' },
        },

        // Setting the container height explicitly when the year picker is visible
        // to avoid flickering
        '& .MuiPickersFadeTransitionGroup-root:has(.MuiYearCalendar-root)': { height: '280px' },

        // Header container - Month Name + Arrows
        '& .MuiPickersCalendarHeader-root': { paddingRight: '14px' },

        // Month Name Dropdown Icon
        '& .MuiPickersCalendarHeader-switchViewButton, & .MuiPickersArrowSwitcher-button': {
          width: token.Spacing.SpacingXl,
          height: token.Spacing.SpacingXl,
          padding: 0,

          '&:focus-visible': { outlineColor: `${palette.semantic.colorFocusIndicator} !important` },

          '&:hover': { backgroundColor: palette.semantic.colorBackgroundHover },
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
          color: palette.semantic.colorForegroundDeEmp,
        },

        // Month - Week Rows Container
        '& .MuiDayCalendar-monthContainer': {
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--date-picker-weeks-rows-gap)',
          overflow: 'visible',
          marginTop: `${dayFocusIndicatorSize}px`,
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
          backgroundColor: 'transparent',
          color: palette.semantic.colorForegroundDeEmp,
          fontSize: token.FontFamily.FontMSize,
          margin: 0,

          '&:focus-visible': {
            outline: `2px ${palette.semantic.colorFocusIndicator} solid !important`,
            outlineOffset: '1px',
          },

          '&:hover': { backgroundColor: palette.semantic.colorBackgroundHover },

          // Today
          '&.MuiPickersDay-today': {
            borderColor: palette.semantic.colorForegroundDeEmp,
            backgroundColor: 'transparent',

            '&:hover': { backgroundColor: palette.semantic.colorBackgroundHover },
          },

          // Disabled / Unselectable day
          '&.Mui-disabled': { color: palette.semantic.colorForegroundDisable },

          // Selected Day
          '&.Mui-selected': {
            backgroundColor: palette.semantic.colorPrimary,
            color: palette.semantic.colorForegroundInverse,

            '&:hover': { backgroundColor: palette.semantic.colorPrimary },
          },
        },

        // Year Button Container
        '& .MuiPickersYear-root': { height: '48px' },

        // Year Button
        '& .MuiPickersYear-yearButton': {
          width: '56px',
          height: '32px',
          borderRadius: token.Border.BorderRadiusS,
          backgroundColor: 'transparent',
          color: palette.semantic.colorForegroundDeEmp,
          fontSize: token.FontFamily.FontMSize,
          fontWeight: token.FontFamily.FontWeightSemibold,
          lineHeight: token.FontFamily.FontMLineHeight,

          '&:focus-visible': {
            outline: `2px ${palette.semantic.colorFocusIndicator} solid !important`,
            outlineOffset: '2px',
          },

          '&:hover': { backgroundColor: palette.semantic.colorBackgroundHover },

          '&.Mui-selected': {
            backgroundColor: palette.semantic.colorPrimary,
            color: palette.semantic.colorForegroundInverse,

            '&:hover': { backgroundColor: palette.semantic.colorPrimary },
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

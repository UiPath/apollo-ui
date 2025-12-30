import token from '@uipath/apollo-core';
import type { Palette } from '@uipath/apollo-core/tokens/jss/palette';

// Define stepper circle properties for consistent sizing
const stepperCircle = {
  originalSize: 24,
  size: 28,
  fontSize: 12,
  scaleFactor: 1,
};
stepperCircle.scaleFactor = stepperCircle.size / stepperCircle.originalSize;

export const MuiStepper = (palette: Palette) => ({
  root: {
    cursor: 'default',
    userSelect: 'none',

    '.MuiStepConnector-line': { borderColor: palette.semantic.colorBorderDeEmp },
  },
  vertical: {
    '.MuiStepLabel-root': { padding: '0px' },
    '.MuiStepConnector-root': { marginLeft: `${stepperCircle.size / 2}px !important` },
    '.MuiStepConnector-line': { minHeight: '16px' },
  },
});

export const MuiStep = (palette: Palette) => ({
  root: {
    // Step Circle SVG
    '.MuiStepIcon-root': {
      // Inactive step background
      color: palette.semantic.colorForegroundDeEmp,
      // Set the size of the circle
      fontSize: `${stepperCircle.size}px`,

      '.MuiStepIcon-text': {
        ...token.Typography.fontSizeSBold,
        fill: palette.semantic.colorBackgroundDisabled,
        // Inverse the scale of the font size to make it look like 12px
        fontSize: `${stepperCircle.fontSize / stepperCircle.scaleFactor}px`,
      },

      '&.Mui-active, &.Mui-completed': {
        // Active step background
        color: palette.semantic.colorPrimary,
        '.MuiStepIcon-text': { fill: palette.semantic.colorBackground },
      },
    },

    '.MuiStepLabel-iconContainer': { paddingRight: '12px' },

    '.MuiStepLabel-label': {
      // Unselected step label
      ...token.Typography.fontSizeM,
      color: palette.semantic.colorForegroundEmp,

      '&.Mui-active, &.Mui-completed': {
        ...token.Typography.fontSizeMBold,
        color: palette.semantic.colorForegroundEmp,
      },
    },

    // Fixing mouse cursor for inactive clickable steps
    '.MuiStepButton-root': { '&.Mui-disabled': { cursor: 'inherit' } },
  },
});

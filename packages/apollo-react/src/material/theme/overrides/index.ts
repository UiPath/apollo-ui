import type { Components } from '@mui/material';
import { darkPalette, lightPalette } from '@uipath/apollo-core';
import {
  darkHighContrastPalette,
  lightHighContrastPalette,
  type Palette,
} from '@uipath/apollo-core/tokens/jss/palette';

import { MuiAccordion } from './MuiAccordion';
import { MuiAccordionDetails } from './MuiAccordionDetails';
import { MuiAccordionSummary } from './MuiAccordionSummary';
import { MuiAlert } from './MuiAlert';
import { MuiAutocomplete } from './MuiAutocomplete';
import { MuiButton } from './MuiButton';
import { MuiButtonBase } from './MuiButtonBase';
import { MuiCheckbox } from './MuiCheckbox';
import { MuiChip } from './MuiChip';
import { MuiCircularProgress } from './MuiCircularProgress';
import { MuiDatepicker } from './MuiDatepicker';
import { MuiDialog } from './MuiDialog';
import { MuiDivider } from './MuiDivider';
import { MuiFab } from './MuiFab';
import { MuiFormControl } from './MuiFormControl';
import { MuiFormControlLabel } from './MuiFormControlLabel';
import { MuiFormHelperText } from './MuiFormHelperText';
import { MuiFormLabel } from './MuiFormLabel';
import { MuiIconButton } from './MuiIconButton';
import { MuiInputAdornment } from './MuiInputAdornment';
import { MuiInputBase } from './MuiInputBase';
import { MuiInputLabel } from './MuiInputLabel';
import { MuiLinearProgress } from './MuiLinearProgress';
import { MuiLink } from './MuiLink';
import { MuiList } from './MuiList';
import { MuiListItem } from './MuiListItem';
import { MuiListItemButton } from './MuiListItemButton';
import { MuiListItemIcon } from './MuiListItemIcon';
import { MuiListItemText } from './MuiListItemText';
import { MuiMenu } from './MuiMenu';
import { MuiMenuItem } from './MuiMenuItem';
import { MuiOutlinedInput } from './MuiOutlinedInput';
import { MuiRadio } from './MuiRadio';
import { MuiSelect } from './MuiSelect';
import { MuiSlider } from './MuiSlider';
import { MuiSnackbar } from './MuiSnackbar';
import { MuiStep, MuiStepper } from './MuiStepper';
import { MuiSwitch } from './MuiSwitch';
import { MuiTab } from './MuiTab';
import { MuiTabs } from './MuiTabs';
import { MuiTextField } from './MuiTextField';
import { MuiTooltip } from './MuiTooltip';
import { MuiTypography } from './MuiTypography';

const muiComponents = {
  MuiAccordion,
  MuiAccordionDetails,
  MuiAccordionSummary,
  MuiAlert,
  MuiButton,
  MuiButtonBase,
  MuiAutocomplete,
  MuiCheckbox,
  MuiChip,
  MuiCircularProgress,
  MuiDialog,
  MuiDivider,
  MuiFab,
  MuiFormControl,
  MuiFormControlLabel,
  MuiFormHelperText,
  MuiFormLabel,
  MuiIconButton,
  MuiInputAdornment,
  MuiInputBase,
  MuiInputLabel,
  MuiLinearProgress,
  MuiLink,
  MuiList,
  MuiListItem,
  MuiListItemButton,
  MuiListItemIcon,
  MuiListItemText,
  MuiMenu,
  MuiMenuItem,
  MuiOutlinedInput,
  MuiRadio,
  MuiSelect,
  MuiSlider,
  MuiSnackbar,
  MuiSwitch,
  MuiTab,
  MuiTabs,
  MuiTextField,
  MuiTooltip,
  MuiTypography,
  MuiPopper: MuiDatepicker,
  MuiStepper,
  MuiStep,
};

const getOverrides = (palette: Palette) =>
  Object.entries(muiComponents).reduce(
    (overrides, [name, muiComponent]) => {
      const componentConfig = muiComponent(palette);

      // Check if the component returns an object with styleOverrides and defaultProps
      if (componentConfig && typeof componentConfig === 'object' && 'styleOverrides' in componentConfig) {
        return {
          ...overrides,
          [name]: componentConfig,
        };
      }

      // Otherwise, treat it as just styleOverrides (backward compatibility)
      return {
        ...overrides,
        [name]: { styleOverrides: componentConfig },
      };
    },
    {}
  );

export const lightOverrides: Components = getOverrides(lightPalette);
export const lightHighContrastOverrides: Components = getOverrides(lightHighContrastPalette);
export const darkOverrides: Components = getOverrides(darkPalette);
export const darkHighContrastOverrides: Components = getOverrides(darkHighContrastPalette);

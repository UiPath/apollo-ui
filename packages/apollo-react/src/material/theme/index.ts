import { Components } from '@mui/material';
import {
    darkPalette,
    lightPalette,
} from '@uipath/apollo-core';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

import { MuiAlert } from './MuiAlert';
import { MuiAutocomplete } from './MuiAutocomplete';
import { MuiButton } from './MuiButton';
import { MuiChip } from './MuiChip';
import { MuiCircularProgress } from './MuiCircularProgress';
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
import { MuiMenuItem } from './MuiMenuItem';
import { MuiOutlinedInput } from './MuiOutlinedInput';
import { MuiSelect } from './MuiSelect';
import { MuiSlider } from './MuiSlider';
import { MuiSnackbar } from './MuiSnackbar';
import { MuiSwitch } from './MuiSwitch';
import { MuiTab } from './MuiTab';
import { MuiTabs } from './MuiTabs';
import { MuiTextField } from './MuiTextField';
import { MuiTooltip } from './MuiTooltip';
import { MuiTypography } from './MuiTypography';

const muiComponents = {
    MuiAlert,
    MuiButton,
    MuiAutocomplete,
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
    MuiMenuItem,
    MuiOutlinedInput,
    MuiSelect,
    MuiSlider,
    MuiSnackbar,
    MuiSwitch,
    MuiTab,
    MuiTabs,
    MuiTextField,
    MuiTooltip,
    MuiTypography,
};

const getOverrides = (palette: Palette) => Object.entries(muiComponents).reduce((overrides, [ name, muiComponent ]) => ({
    ...overrides,
    [name]: { styleOverrides: muiComponent(palette) },
}), {});

export const lightOverrides: Components = getOverrides(lightPalette);
export const darkOverrides: Components = getOverrides(darkPalette);

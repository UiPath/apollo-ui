import { Components } from '@mui/material';
import {
    darkPalette,
    lightPalette,
} from '@uipath/apollo-core';
import { Palette } from '@uipath/apollo-core/lib/jss/palette';

import { MuiAlert } from './MuiAlert';
import { MuiButton } from './MuiButton';

const muiComponents = {
    MuiAlert,
    MuiButton,
};

const getOverrides = (palette: Palette) => Object.entries(muiComponents).reduce((overrides, [ name, muiComponent ]) => ({
    ...overrides,
    [name]: { styleOverrides: muiComponent(palette) },
}), {});

export const lightOverrides: Components = getOverrides(lightPalette);
export const darkOverrides: Components = getOverrides(darkPalette);

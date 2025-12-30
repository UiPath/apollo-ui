import type { Components, PaletteMode } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import type {
  ColorPartial,
  CommonColors,
  PaletteColorOptions,
  PaletteTonalOffset,
  TypeAction,
  TypeBackground,
  TypeText,
} from '@mui/material/styles/createPalette';
import { darkPalette, lightPalette } from '@uipath/apollo-core';
import {
  darkHighContrastPalette,
  lightHighContrastPalette,
  type Palette as IPalette,
} from '@uipath/apollo-core/tokens/jss/palette';
import defaultsDeep from 'lodash/defaultsDeep';

import breakpoints from './breakpoints';
import {
  darkHighContrastOverrides,
  darkOverrides,
  lightHighContrastOverrides,
  lightOverrides,
} from './overrides';
import spacing from './spacing';
import typography from './typography';

// Copied from node_modules/@mui/material/styles/createPalette.d.ts
interface OriginalMUI5PaletteOptions {
  primary?: PaletteColorOptions;
  secondary?: PaletteColorOptions;
  error?: PaletteColorOptions;
  warning?: PaletteColorOptions;
  info?: PaletteColorOptions;
  success?: PaletteColorOptions;
  mode?: PaletteMode;
  tonalOffset?: PaletteTonalOffset;
  contrastThreshold?: number;
  common?: Partial<CommonColors>;
  grey?: ColorPartial;
  text?: Partial<TypeText>;
  divider?: string;
  action?: Partial<TypeAction>;
  background?: Partial<TypeBackground>;
  getContrastText?: (background: string) => string;
}

// Merge the Apollo's IPalette with the MUI's Original PaletteOptions interface and
// ensure that the optional properties are actually defined as optional as in the original PaletteOptions type.
type MergedApolloPaletteOptionsType = Omit<IPalette, keyof OriginalMUI5PaletteOptions> &
  OriginalMUI5PaletteOptions;

declare module '@mui/material/styles/createPalette' {
  interface Palette extends IPalette {}

  interface PaletteOptions extends MergedApolloPaletteOptionsType {}
}

declare module '@mui/private-theming' {
  // DefaultTheme does not include `palette` nor `spacing` values by default
  interface DefaultTheme extends Theme {}
}

const globalPropOverrides: Components = {
  MuiTextField: { defaultProps: { InputLabelProps: { shrink: true } } },
  MuiButtonBase: {
    defaultProps: {
      disableRipple: true,
      disableTouchRipple: true,
    },
  },
};
const getGlobalVariantOverrides = (palette: IPalette): Components => ({
  MuiTypography: {
    variants: [
      {
        props: { color: 'primary' },
        style: { color: palette.semantic.colorPrimary },
      },
      {
        props: { color: 'textPrimary' },
        style: { color: palette.semantic.colorForegroundDeEmp },
      },
      {
        props: { color: 'textSecondary' },
        style: { color: palette.semantic.colorForegroundDeEmp },
      },
    ],
  },
  MuiIconButton: {
    variants: [
      {
        props: { color: 'default' },
        style: { color: palette.semantic.colorIconDefault },
      },
    ],
  },
});

const apolloMaterialUiThemeLight = createTheme({
  palette: {
    ...lightPalette,
    mode: 'light',
  },
  spacing,
  breakpoints,
  components: defaultsDeep(
    lightOverrides,
    globalPropOverrides,
    getGlobalVariantOverrides(lightPalette)
  ),
  typography,
});

const apolloMaterialUiThemeLightHC = createTheme({
  palette: {
    ...lightHighContrastPalette,
    mode: 'light',
  },
  spacing,
  breakpoints,
  components: defaultsDeep(
    lightHighContrastOverrides,
    globalPropOverrides,
    getGlobalVariantOverrides(lightHighContrastPalette)
  ),
  typography,
});

const apolloMaterialUiThemeDark = createTheme({
  palette: {
    ...darkPalette,
    mode: 'dark',
  },
  spacing,
  breakpoints,
  components: defaultsDeep(
    darkOverrides,
    globalPropOverrides,
    getGlobalVariantOverrides(darkPalette)
  ),
  typography,
});

const apolloMaterialUiThemeDarkHC = createTheme({
  palette: {
    ...darkHighContrastPalette,
    mode: 'dark',
  },
  spacing,
  breakpoints,
  components: defaultsDeep(
    darkHighContrastOverrides,
    globalPropOverrides,
    getGlobalVariantOverrides(darkHighContrastPalette)
  ),
  typography,
});

export {
  apolloMaterialUiThemeLight,
  apolloMaterialUiThemeLightHC,
  apolloMaterialUiThemeDark,
  apolloMaterialUiThemeDarkHC,
};

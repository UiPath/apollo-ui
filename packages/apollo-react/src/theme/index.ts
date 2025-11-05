// Apollo React Theme - Material UI theme overrides
import { createTheme, Theme } from '@mui/material/styles';

// Apollo Material UI Theme - Dark
export const apolloMaterialUiThemeDark: Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0066CC',
    },
    secondary: {
      main: '#6C757D',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
});

// Apollo Material UI Theme - Light
export const apolloMaterialUiThemeLight: Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0066CC',
    },
    secondary: {
      main: '#6C757D',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
});

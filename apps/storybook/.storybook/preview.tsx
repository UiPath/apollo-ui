import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import type { Preview } from "@storybook/react";
import {
  apolloMaterialUiThemeDark,
  apolloMaterialUiThemeDarkHC,
  apolloMaterialUiThemeLight,
  apolloMaterialUiThemeLightHC,
} from "@uipath/apollo-react/material/theme";
// biome-ignore lint/correctness/noUnusedImports: needed
import React, { useEffect } from "react";
import { GlobalStyles } from "./GlobalStyles";

// Import Apollo CSS variables
import "@uipath/apollo-react/core/tokens/css/variables.css";
import "@uipath/apollo-react/core/tokens/css/theme-variables.css";
import "@uipath/apollo-react/core/fonts/font.css";

import "@uipath/apollo-react/canvas/styles/variables.css";
import "@uipath/apollo-react/canvas/xyflow/style.css";

// Theme type definition
type ThemeMode = "light" | "dark" | "light-hc" | "dark-hc";

// Simple theme storage
const THEME_STORAGE_KEY = "apollo-storybook-theme";

const getCachedTheme = (): ThemeMode => {
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(THEME_STORAGE_KEY);
    if (cached && ["light", "dark", "light-hc", "dark-hc"].includes(cached)) {
      return cached as ThemeMode;
    }
  }
  return "light";
};

const setTheme = (theme: ThemeMode) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    // Update body class for theme
    document.body.className = theme;
  }
};

// Map theme mode to Apollo Material UI themes
const getApolloTheme = (themeMode: ThemeMode) => {
  switch (themeMode) {
    case "dark":
      return apolloMaterialUiThemeDark;
    case "light-hc":
      return apolloMaterialUiThemeLightHC;
    case "dark-hc":
      return apolloMaterialUiThemeDarkHC;
    default:
      return apolloMaterialUiThemeLight;
  }
};

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        method: "alphabetical",
      },
    },
  },
  globalTypes: {
    theme: {
      description: "Global theme for components",
      defaultValue: getCachedTheme(),
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", icon: "circlehollow", title: "Light" },
          { value: "dark", icon: "circle", title: "Dark" },
          { value: "light-hc", icon: "eye", title: "Light HC" },
          { value: "dark-hc", icon: "globe", title: "Dark HC" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const themeMode = context.globals.theme as ThemeMode;

      // Apply theme on mount and when it changes
      useEffect(() => {
        setTheme(themeMode);
      }, [themeMode]);

      // Get the appropriate Apollo Material UI theme
      const muiTheme = getApolloTheme(themeMode);

      return (
        <ThemeProvider theme={muiTheme}>
          <CssBaseline />
          <GlobalStyles />
          <div
            style={{
              height: "100%",
              width: "100%",
            }}
          >
            <Story />
          </div>
        </ThemeProvider>
      );
    },
  ],
};

export default preview;

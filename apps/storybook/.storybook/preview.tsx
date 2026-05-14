import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { Preview } from '@storybook/react';
import {
  apolloMaterialUiThemeDark,
  apolloMaterialUiThemeDarkHC,
  apolloMaterialUiThemeLight,
  apolloMaterialUiThemeLightHC,
} from '@uipath/apollo-react/material/theme';
// biome-ignore lint/correctness/noUnusedImports: needed
import React, { useEffect } from 'react';
import { GlobalStyles } from './GlobalStyles';

const isDev = import.meta.env.MODE !== 'production';

// The react-scan devtools hook is installed via previewBody in main.ts
// (must happen before React initializes). Here we configure the overlay/canvas
// and start paused — toggling happens via the toolbar global in the decorator.
if (isDev) {
  try {
    const { scan, setOptions } = await import('react-scan');
    scan({ enabled: true, showToolbar: true, allowInIframe: true });
    setOptions({ enabled: false });
  } catch {
    // react-scan optional; preview works without it
  }
}

// Apollo core + canvas CSS
import '@uipath/apollo-react/core/tokens/css/variables.css';
import '@uipath/apollo-react/core/tokens/css/theme-variables.css';
import '@uipath/apollo-react/core/fonts/font.css';
import '@uipath/apollo-react/canvas/styles/variables.css';
import '@uipath/apollo-react/canvas/styles/tailwind.canvas.css';
import '@uipath/apollo-react/canvas/xyflow/style.css';

// Wind: source Tailwind CSS (processed by PostCSS/Tailwind at dev time)
import '@/styles/tailwind.css';

// All available themes
type ThemeMode =
  | 'light'
  | 'dark'
  | 'light-hc'
  | 'dark-hc'
  | 'future-light'
  | 'future-dark'
  | 'wireframe'
  | 'vertex'
  | 'canvas';

const allThemes: ThemeMode[] = [
  'light',
  'dark',
  'light-hc',
  'dark-hc',
  'future-light',
  'future-dark',
  'wireframe',
  'vertex',
  'canvas',
];

// Map every theme to its closest MUI equivalent (used by stories with `parameters.material`)
const muiThemeMap: Record<ThemeMode, typeof apolloMaterialUiThemeLight> = {
  light: apolloMaterialUiThemeLight,
  dark: apolloMaterialUiThemeDark,
  'light-hc': apolloMaterialUiThemeLightHC,
  'dark-hc': apolloMaterialUiThemeDarkHC,
  'future-light': apolloMaterialUiThemeLight,
  'future-dark': apolloMaterialUiThemeDark,
  wireframe: apolloMaterialUiThemeLight,
  vertex: apolloMaterialUiThemeDark,
  canvas: apolloMaterialUiThemeDark,
};

// Custom viewports matching Wind's responsive presets
const customViewports = {
  'screen-xl': {
    name: 'Screen XL 1920',
    styles: { width: '1920px', height: '1080px' },
    type: 'desktop' as const,
  },
  'screen-l': {
    name: 'Screen L 1440',
    styles: { width: '1440px', height: '900px' },
    type: 'desktop' as const,
  },
  'screen-m': {
    name: 'Screen M 1024',
    styles: { width: '1024px', height: '768px' },
    type: 'tablet' as const,
  },
  'screen-s': {
    name: 'Screen S 768',
    styles: { width: '768px', height: '1024px' },
    type: 'tablet' as const,
  },
  'screen-xs': {
    name: 'Screen XS 540',
    styles: { width: '540px', height: '900px' },
    type: 'mobile' as const,
  },
};

const preview: Preview = {
  initialGlobals: {
    theme: 'future-dark',
    reactScan: 'off',
  },
  parameters: {
    backgrounds: { disable: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      options: customViewports,
    },
    options: {
      storySort: {
        order: [
          'Wind',
          [
            'Introduction',
            'Theme',
            [
              'Colors',
              'Logos',
              'Icons',
              'Spacing',
              'Typography',
              'Future',
              ['Theme', 'Colors', 'Icons', '*'],
            ],
            'Components',
            [
              'All Components',
              'Core',
              'Data Display',
              'Feedback',
              'Layout',
              'Navigation',
              'Overlays',
              [
                'UiPath',
                [
                  'Canvas Toolbar',
                  'Chat Composer',
                  'Chat Message',
                  'Flow Node',
                  'Flow Node Expandable',
                  'Hover Menu',
                  'Flow Properties',
                  '*',
                ],
              ],
            ],
            'Templates',
            ['Admin', 'Delegate', 'Flow', 'Maestro', 'Studio', 'Future'],
            'Forms',
            'Experiments',
            '*',
          ],
          'Canvas',
          ['Components', ['All Components', 'BaseNode', 'BaseNode V2', '*'], '*'],
        ],
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Toggle design language theme',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
          { value: 'light-hc', title: 'Light High Contrast' },
          { value: 'dark-hc', title: 'Dark High Contrast' },
          { value: 'future-light', title: 'Future Light' },
          { value: 'future-dark', title: 'Future Dark' },
          { value: 'wireframe', title: 'Wireframe' },
          { value: 'vertex', title: 'Vertex' },
          { value: 'canvas', title: 'Canvas' },
        ],
        dynamicTitle: true,
      },
    },
    ...(isDev && {
      reactScan: {
        description: 'Toggle React Scan rendering highlights',
        toolbar: {
          title: 'React Scan',
          icon: 'beaker',
          items: [
            { value: 'off', title: 'React Scan: Off' },
            { value: 'on', title: 'React Scan: On' },
          ],
          dynamicTitle: true,
        },
      },
    }),
  },
  decorators: [
    (Story, context) => {
      const theme = (context.globals.theme ?? 'future-dark') as ThemeMode;
      const reactScanEnabled = context.globals.reactScan === 'on';

      // Apply theme class to <body>. All themes (core and element) use <body>:
      // - Core themes match body.light/body.dark in apollo-core theme-variables.css
      // - Element themes match .future-dark/.vertex/etc. in Wind tailwind.consumer.css
      useEffect(() => {
        const body = document.body;
        body.classList.remove(...allThemes);
        body.classList.add(theme);
        return () => {
          body.classList.remove(...allThemes);
        };
      }, [theme, context.id]);

      // Toggle react-scan
      useEffect(() => {
        if (isDev) {
          import('react-scan').then(({ setOptions }) => {
            setOptions({
              enabled: reactScanEnabled,
              showToolbar: reactScanEnabled,
            });
          });
        }
      }, [reactScanEnabled]);

      const isFullscreen = context.parameters?.layout === 'fullscreen';
      const useMaterial = context.parameters?.material === true;

      // Stories with `parameters.material` get MUI ThemeProvider + CssBaseline +
      // GlobalStyles. Used by legacy MUI-based stories (e.g. react-playground).
      if (useMaterial) {
        const muiTheme = muiThemeMap[theme];
        return (
          <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            <GlobalStyles />
            <div style={{ height: '100%', width: '100%' }}>
              <Story />
            </div>
          </ThemeProvider>
        );
      }

      return (
        <div className={isFullscreen ? 'h-screen' : 'p-1'}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;

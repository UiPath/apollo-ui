import type { Preview } from '@storybook/react-vite';
import React, { useEffect } from 'react';
import '../src/styles/tailwind.css';

const isDev = import.meta.env.MODE !== 'production';

// The react-scan devtools hook is installed via previewBody in main.ts
// (must happen before React initializes). Here we configure the overlay/canvas
// and start paused — toggling happens via the toolbar global in the decorator.
// Wrapped in try/catch so preview still loads if react-scan fails.
if (isDev) {
  try {
    const { scan, setOptions } = await import('react-scan');
    scan({ enabled: true, showToolbar: true, allowInIframe: true });
    setOptions({ enabled: false });
  } catch {
    // react-scan optional; preview works without it
  }
}

// Custom viewports: named by screen size with widths matching common breakpoints.
// "Reset viewport" is provided by Storybook; these options replace the default device list.
const customViewports = {
  'screen-xl': {
    name: 'Screen XL 1920',
    styles: { width: '1920px', height: '1080px' },
    type: 'desktop',
  },
  'screen-l': {
    name: 'Screen L 1440',
    styles: { width: '1440px', height: '900px' },
    type: 'desktop',
  },
  'screen-m': {
    name: 'Screen M 1024',
    styles: { width: '1024px', height: '768px' },
    type: 'tablet',
  },
  'screen-s': {
    name: 'Screen S 768',
    styles: { width: '768px', height: '1024px' },
    type: 'tablet',
  },
  'screen-xs': {
    name: 'Screen XS 540',
    styles: { width: '540px', height: '900px' },
    type: 'mobile',
  },
};

const preview: Preview = {
  initialGlobals: {
    theme: 'future-dark',
    reactScan: 'off',
  },
  parameters: {
    backgrounds: { disable: true },
    viewport: {
      options: customViewports,
    },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Theme',
          ['Colors', 'Icons', 'Spacing', 'Typography', 'Future', ['Theme', '*']],
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
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
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
      const reactScanEnabled = context.globals.reactScan === 'on';
      const theme: string = context.globals.theme ?? 'future-dark';

      // Apollo-core themes use body.light / body.dark class selectors (from
      // @uipath/apollo-core/tokens/css/theme-variables.css). Future and Demo
      // themes use element-level class selectors (.future-dark, .vertex, etc.).
      const coreThemes = React.useMemo(() => ['light', 'dark', 'light-hc', 'dark-hc'], []);
      const elementThemes = React.useMemo(
        () => ['future-dark', 'future-light', 'wireframe', 'vertex', 'canvas'],
        []
      );
      const allThemes = React.useMemo(
        () => [...coreThemes, ...elementThemes],
        [coreThemes, elementThemes]
      );

      const isCoreTheme = coreThemes.includes(theme);

      useEffect(() => {
        const root = document.documentElement;
        const body = document.body;

        // Clear all theme classes from both <html> and <body>
        root.classList.remove(...allThemes);
        body.classList.remove(...allThemes);

        if (isCoreTheme) {
          body.classList.add(theme);
        } else {
          root.classList.add(theme);
        }

        return () => {
          root.classList.remove(...allThemes);
          body.classList.remove(...allThemes);
        };
      }, [theme, isCoreTheme, allThemes]);

      useEffect(() => {
        if (isDev) {
          import('react-scan').then(({ setOptions }) => {
            setOptions({ enabled: reactScanEnabled, showToolbar: reactScanEnabled });
          });
        }
      }, [reactScanEnabled]);

      const isFullscreen = context.parameters?.layout === 'fullscreen';

      return (
        <div className={isFullscreen ? 'h-screen' : 'p-1'}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;

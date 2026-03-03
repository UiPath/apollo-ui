import type { Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
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
    theme: 'dark',
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
          ['Colors', 'Icons', 'Spacing', 'Typography', 'Future', ['*', 'Theme']],
          'Components',
          [
            'All Components',
            'Core',
            'Data Display',
            'Feedback',
            'Layout',
            'Navigation',
            'Overlays',
            'UiPath',
          ],
          'Templates',
          ['Admin', 'Delegate', 'Flow', 'Maestro', 'Future'],
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
          { value: 'light-hc', title: 'Light HC' },
          { value: 'dark-hc', title: 'Dark HC' },
          { value: 'future-light', title: 'Future: Light' },
          { value: 'future-dark', title: 'Future: Dark' },
          { value: 'wireframe', title: 'Demo: Wireframe' },
          { value: 'vertex', title: 'Demo: Vertex' },
          { value: 'canvas', title: 'Demo: Canvas' },
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
      const theme: string = context.globals.theme ?? 'dark';

      // Map the toolbar value to the CSS class that activates the correct
      // set of CSS custom properties (surfaces, foregrounds, borders, etc.).
      const themeClassMap: Record<string, string> = {
        dark: 'dark',
        light: 'light',
        'dark-hc': 'dark-hc',
        'light-hc': 'light-hc',
        'future-dark': 'future-dark',
        'future-light': 'future-light',
        wireframe: 'wireframe',
        vertex: 'vertex',
        canvas: 'canvas',
      };
      const themeClass = themeClassMap[theme] ?? 'dark';

      // Apply the theme class to <body> for body.dark/body.light themes,
      // and to <html> for other themes (.future-dark, .wireframe, etc.)
      useEffect(() => {
        const bodyThemes = ['dark', 'light', 'dark-hc', 'light-hc'];
        const isBodyTheme = bodyThemes.includes(themeClass);
        const targetElement = isBodyTheme ? document.body : document.documentElement;

        const allThemeClasses = [
          'dark',
          'light',
          'dark-hc',
          'light-hc',
          'future-dark',
          'future-light',
          'wireframe',
          'vertex',
          'canvas',
        ];

        // Remove from both body and html
        document.body.classList.remove(...allThemeClasses);
        document.documentElement.classList.remove(...allThemeClasses);

        // Apply to correct element
        targetElement.classList.add(themeClass);

        return () => {
          targetElement.classList.remove(themeClass);
        };
      }, [themeClass]);

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

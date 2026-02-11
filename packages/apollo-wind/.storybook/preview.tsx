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
    futureTheme: 'dark',
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
          'Components',
          [
            'All Components',
            'Core',
            'Data Display',
            'Layout',
            'Navigation',
            'Overlays',
            'Feedback',
          ],
          'Templates',
          'Forms',
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
    futureTheme: {
      description: 'Toggle design language theme',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'dark', title: 'Future: Dark' },
          { value: 'light', title: 'Future: Light' },
          { value: 'legacy-dark', title: 'Legacy: Dark' },
          { value: 'legacy-light', title: 'Legacy: Light' },
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
      const futureTheme: string = context.globals.futureTheme ?? 'dark';

      // Map the toolbar value to the CSS class that activates the correct
      // set of CSS custom properties (surfaces, foregrounds, borders, etc.).
      const themeClass =
        futureTheme === 'legacy-dark'
          ? 'legacy-dark'
          : futureTheme === 'legacy-light'
            ? 'legacy-light'
            : futureTheme === 'light'
              ? 'future-light'
              : 'future-dark';

      // Apply the theme class to <html> so every story — including standalone
      // component stories that don't manage their own theme — inherits the
      // correct CSS variables (shadcn bridge + Future tokens).
      useEffect(() => {
        const root = document.documentElement;
        const allThemeClasses = ['future-dark', 'future-light', 'legacy-dark', 'legacy-light'];
        root.classList.remove(...allThemeClasses);
        root.classList.add(themeClass);
        return () => {
          root.classList.remove(themeClass);
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

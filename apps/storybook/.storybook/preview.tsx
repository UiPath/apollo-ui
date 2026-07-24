import { loader } from '@monaco-editor/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { Preview } from '@storybook/react';
import { SUPPORTED_LOCALES } from '@uipath/apollo-react/i18n';
import {
  apolloMaterialUiThemeDark,
  apolloMaterialUiThemeDarkHC,
  apolloMaterialUiThemeFutureDark,
  apolloMaterialUiThemeFutureLight,
  apolloMaterialUiThemeLight,
  apolloMaterialUiThemeLightHC,
} from '@uipath/apollo-react/material/theme';
// biome-ignore lint/correctness/noUnusedImports: needed
import React, { useEffect } from 'react';
import { ApolloDocsContainer } from './DocsContainer';
import { GlobalStyles } from './GlobalStyles';
import { ALL_THEMES, clampThemeForMaterial, DEFAULT_THEME, type ThemeMode } from './themes';

// Load Monaco from the app's own origin (/monaco/vs, copied via staticDirs in
// main.ts) instead of the default jsdelivr CDN, which is blocked on the Coded
// App host. Resolve against document.baseURI so it is correct under the Coded
// App sub-path and in dev.
if (typeof document !== 'undefined') {
  loader.config({ paths: { vs: new URL('monaco/vs', document.baseURI).href } });
}

// The react-scan devtools hook is installed via previewBody in main.ts
// (must happen before React initializes). Here we configure the overlay/canvas
// and start paused — toggling happens via the toolbar global in the decorator.
try {
  const { scan, setOptions } = await import('react-scan');
  scan({ enabled: true, showToolbar: true, allowInIframe: true });
  setOptions({ enabled: false });
} catch {
  // react-scan optional; preview works without it
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

// Human-readable display names for the locale toolbar.
const LOCALE_LABELS: Record<(typeof SUPPORTED_LOCALES)[number], string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  de: 'Deutsch',
  fr: 'Français',
  ja: '日本語',
  ko: '한국어',
  ru: 'Русский',
  tr: 'Türkçe',
  'zh-CN': '中文 (简体)',
  'zh-TW': '中文 (繁體)',
  'pt-BR': 'Português (Brasil)',
  'es-MX': 'Español (México)',
  ro: 'Română',
};

// Map every theme to its MUI equivalent (used by stories with `parameters.material`).
// Demo themes never reach Material stories (clamped in the decorator and hidden
// from the selector by the manager tool) but keep closest-match fallbacks.
const muiThemeMap: Record<ThemeMode, typeof apolloMaterialUiThemeLight> = {
  light: apolloMaterialUiThemeLight,
  dark: apolloMaterialUiThemeDark,
  'light-hc': apolloMaterialUiThemeLightHC,
  'dark-hc': apolloMaterialUiThemeDarkHC,
  'future-light': apolloMaterialUiThemeFutureLight,
  'future-dark': apolloMaterialUiThemeFutureDark,
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
    locale: 'en',
  },
  parameters: {
    backgrounds: { disable: true },
    docs: {
      container: ApolloDocsContainer,
    },
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
          'Introduction',
          'Apollo Wind',
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
              [
                'ButtonGroup',
                'Button',
                'Checkbox',
                'Combobox',
                'Date Picker',
                'DateTime Picker',
                'File Upload',
                'Input',
                'Input Group',
                'Label',
                'Multi Select',
                'Radio Group',
                'Select',
                'Slider',
                'Switch',
                'Textarea',
                'Toggle Group',
                'Toggle',
              ],
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
          'Apollo React',
          [
            'Canvas',
            [
              'Introduction',
              'Theme',
              'Components',
              [
                'All Components',
                'Canvas',
                'Controls',
                'Edges',
                'Layout',
                'Nodes',
                'Panels',
                [
                  'Node Property Trigger',
                  'Node Manifest Panel',
                  'Node Flyout Panel',
                  'Node Flyout Probe',
                  '*',
                ],
                'Primitives',
                '*',
              ],
              'Templates',
              [
                'Canvas Blank',
                'Canvas with Panels',
                'Canvas Agent Flow',
                'Canvas Agent Flow Coded',
                '*',
              ],
              '*',
            ],
            'Material (Maintenance Only)',
            ['Introduction', 'Components', ['All Components', '*'], '*'],
            '*',
          ],
          'Apollo Core',
          [
            'Introduction',
            'Theme',
            [
              'Colors',
              'Typography',
              'Spacing',
              'Borders',
              'Shadows',
              'Icons',
              'Screens',
              'CSS Variables',
              '*',
            ],
            '*',
          ],
        ],
      },
    },
  },
  globalTypes: {
    // Theme selection UI lives in .storybook/manager.tsx (custom tool) so the
    // item list can be filtered per story (Material stories hide demo themes).
    theme: {
      description: 'Toggle design language theme',
    },
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
    // Locale toolbar — sets <html lang>, which `ApI18nProvider` picks up as its
    // fallback locale (see packages/apollo-react/src/i18n/ApI18nProvider.tsx).
    locale: {
      description: 'Locale for ApI18nProvider (sets <html lang>)',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: SUPPORTED_LOCALES.map((code) => ({ value: code, title: LOCALE_LABELS[code] })),
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const useMaterial = context.parameters?.material === true;
      const globalTheme = (context.globals.theme ?? DEFAULT_THEME) as ThemeMode;
      // Material stories never render with Wind-only demo themes (the manager
      // tool also auto-corrects the global; this is the same-frame guarantee).
      const theme = useMaterial ? clampThemeForMaterial(globalTheme) : globalTheme;
      const reactScanEnabled = context.globals.reactScan === 'on';
      const locale = (context.globals.locale ?? 'en') as (typeof SUPPORTED_LOCALES)[number];

      // Apply theme class to <body>. All themes (core and element) use <body>:
      // - Core themes match body.light/body.dark in apollo-core theme-variables.css
      // - Element themes match .future-dark/.vertex/etc. in Wind tailwind.consumer.css
      useEffect(() => {
        const body = document.body;
        body.classList.remove(...ALL_THEMES);
        body.classList.add(theme);
        return () => {
          body.classList.remove(...ALL_THEMES);
        };
      }, [theme, context.id]);

      // Toggle react-scan
      useEffect(() => {
        import('react-scan')
          .then(({ setOptions }) => {
            setOptions({
              enabled: reactScanEnabled,
              showToolbar: reactScanEnabled,
            });
          })
          .catch(() => {
            // react-scan optional; preview works without it
          });
      }, [reactScanEnabled]);

      // Write synchronously during the decorator render so the freshly-mounted ApI18nProvider
      // (forced by the `key={locale}` below) sees the new value on its first render.
      if (typeof document !== 'undefined' && document.documentElement.lang !== locale) {
        document.documentElement.lang = locale;
      }

      const isFullscreen = context.parameters?.layout === 'fullscreen';

      // Stories with `parameters.material` get MUI ThemeProvider + CssBaseline +
      // GlobalStyles (Material Overrides stories).
      if (useMaterial) {
        const muiTheme = muiThemeMap[theme];
        // key={locale} forces a story remount so mount-time i18n (ApI18nProvider
        // reading <html lang>) picks up the new locale. Stories that receive the
        // locale as a reactive prop (e.g. Chat, whose harness owns a stateful
        // service singleton that must NOT be torn down) opt out via
        // `parameters.localeRemount: false`.
        const remountKey = context.parameters?.localeRemount === false ? 'static' : locale;
        return (
          <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            <GlobalStyles />
            <div
              key={remountKey}
              style={{
                height: '100%',
                width: '100%',
                // previewHead strips #storybook-root padding globally; give
                // regular stories breathing room, keep fullscreen edge-to-edge.
                padding: isFullscreen ? 0 : 24,
                boxSizing: 'border-box',
              }}
            >
              <Story />
            </div>
          </ThemeProvider>
        );
      }

      return (
        <div key={locale} className={isFullscreen ? 'h-screen' : 'p-1'}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;

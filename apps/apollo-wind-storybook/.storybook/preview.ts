import type { Preview } from '@storybook/react';

import '../src/index.css';
import '@uipath/apollo-wind-ui/utilities.css';

const preview: Preview = {
  // Global types for custom toolbar controls
  globalTypes: {
    themeMode: {
      description: 'Theme mode (light/dark)',
      toolbar: {
        title: 'Mode',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
    themeContrast: {
      description: 'Theme contrast level',
      toolbar: {
        title: 'Contrast',
        icon: 'contrast',
        items: [
          { value: 'regular', title: 'Regular' },
          { value: 'high-contrast', title: 'High Contrast' },
        ],
        dynamicTitle: true,
      },
    },
  },

  // Initial global values
  initialGlobals: {
    themeMode: 'light',
    themeContrast: 'regular',
  },

  parameters: {
    // Configure story sorting
    options: {
      storySort: {
        order: ['Introduction', 'Tutorial', 'Reference', ['Tokens', 'Component Utilities']],
      },
    },
    // Disable built-in backgrounds toolbar
    backgrounds: {
      disable: true,
    },
    // Configure actions
    actions: { argTypesRegex: '^on[A-Z].*' },
    // Configure controls
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    // Configure docs
    docs: {
      toc: true,
    },
  },

  // Global decorators
  decorators: [
    (Story, context) => {
      // Apply theme class based on toolbar selections
      const mode = context.globals.themeMode || 'light';
      const contrast = context.globals.themeContrast || 'regular';
      const bodyClasses = ['apollo-design', 'light', 'dark', 'light-hc', 'dark-hc'];

      // Compute theme class: light, dark, light-hc, or dark-hc
      let themeClass: string;
      if (contrast === 'high-contrast') {
        themeClass = mode === 'dark' ? 'dark-hc' : 'light-hc';
      } else {
        themeClass = mode;
      }

      // Update body classes
      document.body.classList.remove(...bodyClasses);
      document.body.classList.add('apollo-design', themeClass);

      return Story();
    },
  ],
};

export default preview;

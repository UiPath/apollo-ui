import { create } from 'storybook/theming';

export default create({
  base: 'dark', // Default to dark; user can switch to light via Storybook UI if desired
  brandTitle: 'UiPath',
  brandImage: '/ui-path.svg',
  brandTarget: '_self',
});

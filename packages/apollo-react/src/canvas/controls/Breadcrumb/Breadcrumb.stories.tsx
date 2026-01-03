import type { Meta, StoryObj } from '@storybook/react';
import { ApIcon } from '@uipath/apollo-react/material/components';
import { Breadcrumb } from './Breadcrumb';

const meta: Meta<typeof Breadcrumb> = {
  title: 'Core/Controls/Breadcrumb',
  component: Breadcrumb,
};
export default meta;

type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {
  args: {
    items: [
      {
        label: 'Home',
        startAdornment: <ApIcon name="home" />,
        onClick: () => alert('Home clicked'),
      },
      {
        label: 'Library',
        endAdornment: <ApIcon name="error" color="var(--color-error-icon)" />,
        onClick: () => alert('Library clicked'),
      },
      { label: 'Settings', endAdornment: <ApIcon name="settings" /> },
    ],
    delimiter: <ApIcon name="chevron_right" />,
  },
};

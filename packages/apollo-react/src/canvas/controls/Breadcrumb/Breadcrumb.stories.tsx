import type { Meta, StoryObj } from '@storybook/react';
import { CanvasIcon } from '@uipath/apollo-react/canvas';
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
        startAdornment: <CanvasIcon icon="home" />,
        onClick: () => alert('Home clicked'),
      },
      {
        label: 'Library',
        endAdornment: <CanvasIcon icon="alert-circle" color="var(--color-error-icon)" />,
        onClick: () => alert('Library clicked'),
      },
      { label: 'Settings', endAdornment: <CanvasIcon icon="settings" /> },
    ],
    delimiter: <CanvasIcon icon="chevron-right" />,
  },
};

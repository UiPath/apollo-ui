import type { Meta, StoryObj } from '@storybook/react-vite';

import { FormDesigner } from './form-designer';

const meta: Meta<typeof FormDesigner> = {
  title: 'Forms/Designer',
  component: FormDesigner,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof FormDesigner>;

export const Default: Story = {};

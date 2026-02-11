import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormBuilderExample } from './form-builder-example';

const meta = {
  title: 'Forms/Form Builder',
  component: FormBuilderExample,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof FormBuilderExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

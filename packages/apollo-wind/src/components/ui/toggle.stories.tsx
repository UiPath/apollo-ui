import type { Meta } from '@storybook/react-vite';
import { Toggle } from './toggle';

const meta: Meta<typeof Toggle> = {
  title: 'Design System/Core/Toggle',
  component: Toggle,
  tags: ['autodocs'],
};

export default meta;

export const Default = {
  args: {},
  render: () => <Toggle>Toggle</Toggle>,
};

export const Outline = {
  args: {},
  render: () => <Toggle variant="outline">Outline</Toggle>,
};

export const Disabled = {
  args: {},
  render: () => <Toggle disabled>Disabled</Toggle>,
};

export const WithText = {
  args: {},
  render: () => <Toggle aria-label="Toggle bold">Bold</Toggle>,
};

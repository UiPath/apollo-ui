import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShellExample } from './app-shell-example';

const meta = {
  title: 'Templates/Current/App Shell',
  component: AppShellExample,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof AppShellExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

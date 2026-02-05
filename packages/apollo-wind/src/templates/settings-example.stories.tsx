import type { Meta, StoryObj } from '@storybook/react-vite';
import { SettingsExample } from './settings-example';

const meta = {
  title: 'Templates/Current/Settings',
  component: SettingsExample,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SettingsExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

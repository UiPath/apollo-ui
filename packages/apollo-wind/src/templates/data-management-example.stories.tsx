import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataManagementExample } from './data-management-example';

const meta = {
  title: 'Templates/Current/Data Management',
  component: DataManagementExample,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof DataManagementExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

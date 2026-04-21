import type { Meta, StoryObj } from '@storybook/react-vite';
import { FeedbackForm } from './feedback-form';

const meta = {
  title: 'Templates/Feedback Form',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Default',
  render: (_, { globals }) => (
    <FeedbackForm theme={globals.theme || 'future-dark'} />
  ),
};

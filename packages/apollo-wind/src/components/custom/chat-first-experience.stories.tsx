import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatFirstExperience } from './chat-first-experience';

const meta = {
  title: 'Components/UiPath/Chat First Experience',
  component: ChatFirstExperience,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ChatFirstExperience>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="future-dark flex h-screen bg-future-surface">
      <ChatFirstExperience
        userName="David"
        subtitle="What should we work on today?"
        suggestions={[
          { id: '1', label: 'Make a list of affordable apartments in NYC' },
          { id: '2', label: 'Find the highest CD rates' },
          { id: '3', label: 'Lorem ipsum dolor sit amet' },
        ]}
      />
    </div>
  ),
};

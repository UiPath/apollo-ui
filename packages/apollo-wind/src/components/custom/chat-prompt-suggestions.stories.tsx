import type { Meta, StoryObj } from '@storybook/react-vite';
import { PromptSuggestions } from './chat-prompt-suggestions';

const meta = {
  title: 'Components/UiPath/Prompt Suggestions',
  component: PromptSuggestions,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof PromptSuggestions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="future-dark bg-future-surface p-8">
      <PromptSuggestions
        suggestions={[
          { id: '1', label: 'Make a list of affordable apartments in NYC' },
          { id: '2', label: 'Find the highest CD rates' },
          { id: '3', label: 'Summarize my latest emails' },
          { id: '4', label: 'Create a weekly expense report' },
        ]}
      />
    </div>
  ),
};

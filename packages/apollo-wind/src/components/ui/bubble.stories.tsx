import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from './bubble';

const meta: Meta<typeof Bubble> = {
  title: 'Chat/Components/Bubble',
  component: Bubble,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The surface of a chat message. Bubble positions and colours, BubbleContent is the padded box the text lives in, so reactions or actions can sit outside the box. Inside an end-aligned Message the bubble follows the row; standalone, set align="end".',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="flex w-[420px] flex-col gap-3 rounded-xl border border-border-subtle bg-card p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS = ['default', 'secondary', 'muted', 'outline', 'ghost', 'destructive'] as const;

export const Variants: Story = {
  render: () => (
    <>
      {VARIANTS.map((variant) => (
        <Bubble key={variant} variant={variant}>
          <BubbleContent>
            The {variant} variant. Long text wraps inside the content box and the bubble stays
            within 80% of its container.
          </BubbleContent>
        </Bubble>
      ))}
    </>
  ),
};

export const Alignment: Story = {
  render: () => (
    <>
      <Bubble variant="muted" align="start">
        <BubbleContent>Aligned to the start, for the other party.</BubbleContent>
      </Bubble>
      <Bubble align="end">
        <BubbleContent>Aligned to the end, for the current user.</BubbleContent>
      </Bubble>
    </>
  ),
};

export const WithReactions: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'BubbleReactions floats a pill over a corner of the bubble. Give the group a little extra gap so pills do not overlap the next bubble.',
      },
    },
  },
  render: () => (
    <BubbleGroup className="gap-4">
      <Bubble variant="muted">
        <BubbleContent>Approved both invoices and flagged #4023 for review.</BubbleContent>
        <BubbleReactions side="bottom" align="end">
          <span role="img" aria-label="Thumbs up">
            👍
          </span>
          <span className="text-xs text-muted-foreground">2</span>
        </BubbleReactions>
      </Bubble>
      <Bubble align="end">
        <BubbleContent>Thanks!</BubbleContent>
        <BubbleReactions side="bottom" align="start">
          <span role="img" aria-label="Heart">
            ❤️
          </span>
        </BubbleReactions>
      </Bubble>
    </BubbleGroup>
  ),
};

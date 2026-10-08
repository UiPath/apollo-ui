import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Button } from './button';
import { LiveRegion, type LiveRegionHandle } from './live-region';

const meta: Meta<typeof LiveRegion> = {
  title: 'Chat/Components/Live Region',
  component: LiveRegion,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A visually hidden region that screen readers speak when its text changes. Nothing renders on screen: turn on a screen reader, or inspect the DOM for data-slot="live-region", to follow along. Render it once up front, then set message or call announce() on the ref. Polite regions use role="status"; assertive ones use role="alert" and should be kept for errors.',
      },
    },
  },
  argTypes: {
    'aria-live': { control: 'inline-radio', options: ['polite', 'assertive'] },
    clearAfter: { control: { type: 'number', min: 0, step: 250 } },
    debounce: { control: { type: 'number', min: 0, step: 50 } },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    'aria-live': 'polite',
    clearAfter: 1000,
    debounce: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Each click announces the new count through the ref handle. The text below only echoes the last announcement for sighted readers; the region itself stays hidden and empties after clearAfter ms.',
      },
    },
  },
  render: (args) => {
    const ref = React.useRef<LiveRegionHandle>(null);
    const [count, setCount] = React.useState(0);
    const [last, setLast] = React.useState('');

    const handleClick = () => {
      const next = count + 1;
      const message = `Count is ${next}`;
      setCount(next);
      setLast(message);
      ref.current?.announce(message);
    };

    return (
      <div className="flex items-center gap-4">
        <Button onClick={handleClick}>Increment</Button>
        <span className="text-sm text-muted-foreground">
          {last ? `Announced: "${last}"` : 'Nothing announced yet'}
        </span>
        <LiveRegion ref={ref} {...args} />
      </div>
    );
  },
};

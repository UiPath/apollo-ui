import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from './label';
import { Textarea } from './textarea';

const meta = {
  title: 'Components/Core/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Type your message here...',
  },
};

export const WithLabel = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="message">Your message</Label>
      <Textarea id="message" placeholder="Type your message here..." />
    </div>
  ),
} satisfies Story;

export const WithText: Story = {
  args: {
    value: 'This is a pre-filled textarea with some content.',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'This textarea is disabled',
    disabled: true,
  },
};

export const WithRows: Story = {
  args: {
    placeholder: 'This textarea has custom rows',
    rows: 10,
  },
};

export const AutoGrow = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="autogrow">Auto-growing field</Label>
      <Textarea
        id="autogrow"
        minRows={3}
        maxRows={7}
        placeholder="Starts at 3 rows and never shrinks below that. Grows with content up to 7 rows, then scrolls. Drag the bottom-right handle to make it taller than 7 rows."
      />
      <p className="text-sm text-muted-foreground">
        <code>{'minRows={3}'}</code> is a floor: the field never renders or resizes shorter than 3
        rows. <code>{'maxRows={7}'}</code> auto-grows with content up to 7 rows, then scrolls. The
        resize handle is not capped, so you can drag past 7 rows to take manual control.
      </p>
    </div>
  ),
} satisfies Story;

export const WithDescription = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="bio">Biography</Label>
      <Textarea id="bio" placeholder="Tell us about yourself..." />
      <p className="text-sm text-muted-foreground">You can use markdown syntax here.</p>
    </div>
  ),
} satisfies Story;

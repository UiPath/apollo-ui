import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './input';
import { Label, RequiredIndicator } from './label';

const meta = {
  title: 'Components/Core/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Label',
  },
};

export const WithInput = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
} satisfies Story;

export const Required = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="required">
        {'Username'}
        <RequiredIndicator className="ml-0" />
      </Label>
      <Input id="required" required placeholder="Enter username" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Use `RequiredIndicator` after the label text for a required field. It inherits the ' +
          "surrounding text color instead of an error color: the field isn't in an error state " +
          "just because it's empty, so a red asterisk overstates it and can be mistaken for a " +
          "validation failure. The asterisk glyph is `aria-hidden`, since it isn't reliably " +
          'announced by assistive tech on its own, and a `sr-only` "(required)" is included ' +
          'alongside it so the label still announces the requirement on its own. Still put ' +
          "`required` (or `aria-required`) on the field's own control so the requirement is " +
          'enforced, not just announced.',
      },
    },
  },
} satisfies Story;

export const WithDescription = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="password">Password</Label>
      <Input type="password" id="password" />
      <p className="text-sm text-muted-foreground">Must be at least 8 characters long</p>
    </div>
  ),
} satisfies Story;

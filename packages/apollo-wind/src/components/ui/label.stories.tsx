import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormFieldDescription } from '../..';
import { Input } from './input';
import { Label, RequiredIndicator } from './label';
import { RadioGroup, RadioGroupItem } from './radio-group';

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

/** The required indicator inherits the label color, so it reads as an attribute of the field. */
export const Required = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="required">
        Username
        <RequiredIndicator />
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

/**
 * `default` names the field itself. Use it whenever the label names the whole
 * field, including one driven by a single switch or checkbox.
 *
 * `muted` de-emphasizes a label that names one option among several inside a
 * field, such as a radio or checkbox option.
 */
export const Variants = {
  render: () => (
    <div className="grid w-full max-w-sm gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="variant-default">
          Notification email
          <RequiredIndicator />
        </Label>
        <Input id="variant-default" placeholder="you@example.com" />
      </div>
      <div className="grid gap-1.5">
        <Label>Delivery frequency</Label>
        <RadioGroup defaultValue="daily" className="grid gap-2">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="daily" id="variant-daily" />
            <Label variant="muted" htmlFor="variant-daily">
              Daily digest
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="weekly" id="variant-weekly" />
            <Label variant="muted" htmlFor="variant-weekly">
              Weekly summary
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  ),
} satisfies Story;

export const WithDescription = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="password">Password</Label>
      <Input type="password" id="password" />
      <FormFieldDescription>Must be at least 8 characters long</FormFieldDescription>
    </div>
  ),
} satisfies Story;

/**
 * Long labels wrap. Do not put `truncate` on the label itself: the required
 * indicator shares the ellipsized run, so a long label hides it.
 *
 * Where a single-line row genuinely cannot grow, make the label a flex
 * container and truncate the text alone, as the second example does. Pair that
 * with `title`, since clipped text is otherwise unreadable.
 */
export const LongText = {
  render: () => (
    <div className="grid w-56 gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="wrapping">
          Conversation identifier from the previous step
          <RequiredIndicator />
        </Label>
        <Input id="wrapping" placeholder="Wraps" />
      </div>
      <div className="grid gap-1.5">
        <Label
          htmlFor="constrained"
          title="Conversation identifier from the previous step"
          className="flex min-w-0 items-center"
        >
          <span className="truncate">Conversation identifier from the previous step</span>
          <RequiredIndicator className="shrink-0" />
        </Label>
        <Input id="constrained" placeholder="Truncates the text only" />
      </div>
    </div>
  ),
} satisfies Story;

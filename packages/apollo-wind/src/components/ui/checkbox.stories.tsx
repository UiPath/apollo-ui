import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Checkbox } from './checkbox';
import { FormFieldError } from './form-field';
import { Label } from './label';
import { Column, Row } from './layout';

const meta = {
  title: 'Components/Core/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithLabel = {
  render: () => (
    <Row gap={2} align="center">
      <Checkbox id="terms" />
      <Label htmlFor="terms" className="future:text-foreground future:font-normal">
        Accept terms and conditions
      </Label>
    </Row>
  ),
} satisfies Story;

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

const CHECKBOX_STATES = [
  { id: 'state-unchecked', label: 'Unchecked', props: {} },
  { id: 'state-checked', label: 'Checked', props: { defaultChecked: true } },
  { id: 'state-indeterminate', label: 'Indeterminate', props: { defaultChecked: 'indeterminate' } },
  {
    id: 'state-disabled-indeterminate',
    label: 'Disabled indeterminate',
    props: { defaultChecked: 'indeterminate', disabled: true },
  },
  {
    id: 'state-invalid-indeterminate',
    label: 'Invalid indeterminate',
    props: { defaultChecked: 'indeterminate', 'aria-invalid': true },
  },
] satisfies { id: string; label: string; props: React.ComponentProps<typeof Checkbox> }[];

export const Indeterminate = {
  render: () => (
    <Row gap={6} align="center">
      {CHECKBOX_STATES.map((state) => (
        <Row key={state.id} gap={2} align="center">
          <Checkbox id={state.id} {...state.props} />
          <Label htmlFor={state.id} className="future:font-normal future:text-foreground">
            {state.label}
          </Label>
        </Row>
      ))}
    </Row>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The indeterminate state next to the other states for comparison. It shares the checked fill and swaps the check for a dash.',
      },
    },
  },
} satisfies Story;

const NOTIFICATION_CHANNELS = [
  { id: 'select-all-email', label: 'Email notifications' },
  { id: 'select-all-push', label: 'Push notifications' },
  { id: 'select-all-sms', label: 'SMS notifications' },
];

function SelectAllExample() {
  const [selected, setSelected] = React.useState<string[]>([NOTIFICATION_CHANNELS[0].id]);
  const allSelected = selected.length === NOTIFICATION_CHANNELS.length;
  const someSelected = selected.length > 0 && !allSelected;

  return (
    <Column gap={2}>
      <Row gap={2} align="center">
        <Checkbox
          id="select-all"
          checked={allSelected ? true : someSelected ? 'indeterminate' : false}
          onCheckedChange={(value) =>
            setSelected(value === true ? NOTIFICATION_CHANNELS.map((c) => c.id) : [])
          }
        />
        <Label htmlFor="select-all" className="future:font-normal future:text-foreground">
          All notifications
        </Label>
      </Row>
      <Column gap={2} className="pl-6">
        {NOTIFICATION_CHANNELS.map((channel) => (
          <Row key={channel.id} gap={2} align="center">
            <Checkbox
              id={channel.id}
              checked={selected.includes(channel.id)}
              onCheckedChange={(value) =>
                setSelected((prev) =>
                  value === true ? [...prev, channel.id] : prev.filter((id) => id !== channel.id)
                )
              }
            />
            <Label htmlFor={channel.id} className="future:font-normal future:text-foreground">
              {channel.label}
            </Label>
          </Row>
        ))}
      </Column>
    </Column>
  );
}

export const SelectAll = {
  render: () => <SelectAllExample />,
  parameters: {
    docs: {
      description: {
        story:
          'Pass `checked="indeterminate"` when only some children are selected. The parent shows a dash and reports `aria-checked="mixed"`. Clicking an indeterminate parent selects every child.',
      },
    },
  },
} satisfies Story;

export const Disabled = {
  render: () => (
    <Row gap={2} align="center">
      <Checkbox id="disabled" disabled />
      <Label htmlFor="disabled" className="future:font-normal future:text-foreground">
        Disabled checkbox
      </Label>
    </Row>
  ),
} satisfies Story;

export const DisabledChecked = {
  render: () => (
    <Row gap={2} align="center">
      <Checkbox id="disabled-checked" disabled defaultChecked />
      <Label htmlFor="disabled-checked" className="future:font-normal future:text-foreground">
        Disabled and checked
      </Label>
    </Row>
  ),
} satisfies Story;

export const WithDescription = {
  render: () => (
    <Column gap={2}>
      <Row gap={2} align="center">
        <Checkbox id="marketing" />
        <Label htmlFor="marketing" className="future:font-normal future:text-foreground">
          Marketing emails
        </Label>
      </Row>
      <p className="text-sm text-muted-foreground pl-6">
        Receive emails about new products, features, and more.
      </p>
    </Column>
  ),
} satisfies Story;

export const Group = {
  render: () => (
    <Column gap={3}>
      <div className="font-medium text-sm">Notification preferences</div>
      <Column gap={2}>
        <Row gap={2} align="center">
          <Checkbox id="all" defaultChecked />
          <Label htmlFor="all" className="future:font-normal future:text-foreground">
            All notifications
          </Label>
        </Row>
        <Row gap={2} align="center">
          <Checkbox id="email" defaultChecked />
          <Label htmlFor="email" className="future:font-normal future:text-foreground">
            Email notifications
          </Label>
        </Row>
        <Row gap={2} align="center">
          <Checkbox id="push" />
          <Label htmlFor="push" className="future:font-normal future:text-foreground">
            Push notifications
          </Label>
        </Row>
        <Row gap={2} align="center">
          <Checkbox id="sms" />
          <Label htmlFor="sms" className="future:font-normal future:text-foreground">
            SMS notifications
          </Label>
        </Row>
      </Column>
    </Column>
  ),
} satisfies Story;

export const WithInlineValidation = {
  render: () => (
    <div className="grid gap-1.5 [&>[data-slot=form-field-error]]:mt-0">
      <div className="flex items-center gap-2">
        <Checkbox
          id="checkbox-terms"
          aria-invalid
          aria-describedby="checkbox-terms-error"
          aria-errormessage="checkbox-terms-error"
        />
        <Label htmlFor="checkbox-terms">I accept the terms of use</Label>
      </div>
      <FormFieldError id="checkbox-terms-error">Accept the terms to continue.</FormFieldError>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Checkbox has no message slot of its own. Set `aria-invalid` for the red stroke and render `FormFieldError` below, pointing `aria-describedby` and `aria-errormessage` at its id.',
      },
    },
  },
};

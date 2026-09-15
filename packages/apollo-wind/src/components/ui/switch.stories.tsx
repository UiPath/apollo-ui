import type { Meta } from '@storybook/react-vite';
import { FormFieldError } from './form-field';
import { Label } from './label';
import { Switch } from './switch';
import { Row } from './layout';

const meta: Meta<typeof Switch> = {
  title: 'Components/Core/Switch',
  component: Switch,
  tags: ['autodocs'],
};

export default meta;

export const Default = {
  args: {},
  render: () => <Switch />,
};

export const WithLabel = {
  args: {},
  render: () => (
    <Row gap={2} align="center">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </Row>
  ),
};

export const Small = {
  args: {},
  render: () => (
    <Row gap={2} align="center">
      <Switch id="case-sensitive" size="sm" />
      <Label htmlFor="case-sensitive" className="text-sm">
        Case sensitive
      </Label>
    </Row>
  ),
};

export const Disabled = {
  args: {},
  render: () => (
    <Row gap={2} align="center">
      <Switch id="disabled" disabled />
      <Label htmlFor="disabled">Disabled</Label>
    </Row>
  ),
};

export const WithInlineValidation = {
  render: () => (
    <div className="grid gap-1.5">
      <Row>
        <Switch
          id="switch-notifications"
          aria-invalid
          aria-describedby="switch-notifications-error"
          aria-errormessage="switch-notifications-error"
        />
        <Label htmlFor="switch-notifications">Send notifications</Label>
      </Row>
      <FormFieldError id="switch-notifications-error">
        Turn on notifications to receive approval requests.
      </FormFieldError>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Switch has no message slot of its own. Set `aria-invalid` for the red stroke and render `FormFieldError` below, pointing `aria-describedby` and `aria-errormessage` at its id.',
      },
    },
  },
};

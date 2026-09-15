import type { Meta } from '@storybook/react-vite';
import { FormFieldError } from './form-field';
import { Label } from './label';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Row } from './layout';

const meta: Meta<typeof RadioGroup> = {
  title: 'Components/Core/Radio Group',
  component: RadioGroup,
  tags: ['autodocs'],
};

export default meta;

export const Default = {
  args: {},
  render: () => (
    <RadioGroup defaultValue="comfortable">
      <Row gap={2} align="center">
        <RadioGroupItem value="default" id="r1" />
        <Label variant="muted" htmlFor="r1">
          Default
        </Label>
      </Row>
      <Row gap={2} align="center">
        <RadioGroupItem value="comfortable" id="r2" />
        <Label variant="muted" htmlFor="r2">
          Comfortable
        </Label>
      </Row>
      <Row gap={2} align="center">
        <RadioGroupItem value="compact" id="r3" />
        <Label variant="muted" htmlFor="r3">
          Compact
        </Label>
      </Row>
    </RadioGroup>
  ),
};

export const WithInlineValidation = {
  render: () => (
    <div className="grid gap-1.5">
      <Label id="radio-priority-label">Priority</Label>
      <RadioGroup
        aria-labelledby="radio-priority-label"
        aria-invalid
        aria-describedby="radio-priority-error"
        aria-errormessage="radio-priority-error"
      >
        <Row>
          <RadioGroupItem value="low" id="radio-priority-low" />
          <Label htmlFor="radio-priority-low">Low</Label>
        </Row>
        <Row>
          <RadioGroupItem value="high" id="radio-priority-high" />
          <Label htmlFor="radio-priority-high">High</Label>
        </Row>
      </RadioGroup>
      <FormFieldError id="radio-priority-error">Choose a priority to continue.</FormFieldError>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'ARIA allows `aria-invalid` on the radiogroup, not on individual radios, so set it on `RadioGroup`. Every item picks up the red stroke from the group. Render `FormFieldError` below and point `aria-describedby` and `aria-errormessage` at its id.',
      },
    },
  },
};

import type { Meta } from '@storybook/react-vite';
import { FormFieldError } from './form-field';
import { Label } from './label';
import { Row } from './layout';
import { RadioGroup, RadioGroupCard, RadioGroupItem } from './radio-group';

const meta: Meta<typeof RadioGroup> = {
  title: 'Components/Core/Radio Group',
  component: RadioGroup,
  tags: ['autodocs'],
};

export default meta;

/** `RadioGroupCard` draws each option as a card: radio dot, title, sub-label and optional tag. */
export const Cards = {
  args: {},
  render: () => (
    <RadioGroup defaultValue="agent" aria-label="Who handles this" className="max-w-md">
      <RadioGroupCard
        value="agent"
        title="Let the agent decide"
        description="The agent resolves the case and records its reasoning."
        tag="Agent"
      />
      <RadioGroupCard
        value="me"
        title="I will decide"
        description="Review the details and choose an outcome yourself."
      />
      <RadioGroupCard value="later" title="Decide later" disabled />
    </RadioGroup>
  ),
};

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
    <div className="grid gap-1.5 [&>[data-slot=form-field-error]]:mt-0">
      <Label id="radio-priority-label">Priority</Label>
      <RadioGroup
        aria-labelledby="radio-priority-label"
        aria-invalid
        aria-describedby="radio-priority-error"
        aria-errormessage="radio-priority-error"
      >
        <Row gap={2} align="center">
          <RadioGroupItem value="low" id="radio-priority-low" />
          <Label variant="muted" htmlFor="radio-priority-low">
            Low
          </Label>
        </Row>
        <Row gap={2} align="center">
          <RadioGroupItem value="high" id="radio-priority-high" />
          <Label variant="muted" htmlFor="radio-priority-high">
            High
          </Label>
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

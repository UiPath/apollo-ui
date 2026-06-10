import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { ApTextArea } from '../components';
import { materialParameters, Section } from './storybook-helpers';

/**
 * `ApTextArea` from `@uipath/apollo-react/material/components` — a multi-line
 * text input component with auto-resize and character limits.
 *
 * ```ts
 * import { ApTextArea } from '@uipath/apollo-react/material/components';
 * ```
 */
const meta: Meta = {
  title: 'Components/Text Area',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

function BasicDemo() {
  const [standardValue, setStandardValue] = useState('');
  const [labeledValue, setLabeledValue] = useState('');
  return (
    <>
      <Labeled label="Standard">
        <ApTextArea
          value={standardValue}
          onChange={(e) => setStandardValue(e.target.value)}
          placeholder="Enter your text here..."
          rows={4}
        />
      </Labeled>
      <Labeled label="With label">
        <ApTextArea
          label="Description"
          value={labeledValue}
          onChange={(e) => setLabeledValue(e.target.value)}
          placeholder="Describe something..."
          rows={4}
        />
      </Labeled>
    </>
  );
}

function ValidationDemo() {
  const [requiredValue, setRequiredValue] = useState('');
  const [feedbackValue, setFeedbackValue] = useState('');
  return (
    <>
      <Labeled label="Required field">
        <ApTextArea
          label="Required Field"
          value={requiredValue}
          onChange={(e) => setRequiredValue(e.target.value)}
          placeholder="This field is required"
          required
          helperText="Please fill out this field"
          rows={3}
        />
      </Labeled>
      <Labeled label="With character limit">
        <ApTextArea
          label="Feedback"
          value={feedbackValue}
          onChange={(e) => setFeedbackValue(e.target.value)}
          placeholder="Enter your feedback..."
          helperText="Share your thoughts"
          characterLimit={200}
          rows={4}
        />
      </Labeled>
    </>
  );
}

function AutoResizeDemo() {
  const [value, setValue] = useState('');
  return (
    <Labeled label="Auto-resize (minRows: 2, maxRows: 8)">
      <ApTextArea
        label="Notes"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type to see auto-resize..."
        minRows={2}
        maxRows={8}
      />
    </Labeled>
  );
}

function StatesDemo() {
  const [disabledValue, setDisabledValue] = useState('This text area is disabled');
  const [readOnlyValue, setReadOnlyValue] = useState(
    'This is a read-only text area that cannot be edited.'
  );
  const [errorValue, setErrorValue] = useState('');
  return (
    <>
      <Labeled label="Disabled">
        <ApTextArea
          value={disabledValue}
          onChange={(e) => setDisabledValue(e.target.value)}
          disabled
          rows={3}
        />
      </Labeled>
      <Labeled label="Read-only">
        <ApTextArea
          label="Read Only"
          value={readOnlyValue}
          onChange={(e) => setReadOnlyValue(e.target.value)}
          readOnly
          rows={3}
        />
      </Labeled>
      <Labeled label="Error">
        <ApTextArea
          label="Required Field"
          value={errorValue}
          onChange={(e) => setErrorValue(e.target.value)}
          placeholder="This field is required"
          errorMessage="This field cannot be empty"
          rows={3}
        />
      </Labeled>
    </>
  );
}

export const Basic: Story = {
  render: () => (
    <Section title="Basic" description="Standard multi-line input, with and without a label.">
      <BasicDemo />
    </Section>
  ),
};

export const ValidationAndLimits: Story = {
  render: () => (
    <Section
      title="Validation and Limits"
      description="Required fields with helper text and character limits."
    >
      <ValidationDemo />
    </Section>
  ),
};

export const AutoResize: Story = {
  render: () => (
    <Section
      title="Auto-resize"
      description="The text area grows with its content between minRows and maxRows."
    >
      <AutoResizeDemo />
    </Section>
  ),
};

export const States: Story = {
  render: () => (
    <Section title="States" description="Disabled, read-only and error states.">
      <StatesDemo />
    </Section>
  ),
};

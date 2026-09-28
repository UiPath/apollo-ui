import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { materialParameters, Row, Section } from './storybook-helpers';

/**
 * Material UI Checkbox component with Apollo theme overrides. Features custom
 * colors, focus states, and check icon styling.
 */
const meta: Meta = {
  title: 'Components/Checkbox',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <Section title="Basic Checkboxes" description="Standard checkboxes with Apollo theme styling.">
      <Row>
        <Checkbox defaultChecked />
        <Checkbox />
        <Checkbox disabled />
        <Checkbox disabled checked />
      </Row>
    </Section>
  ),
};

function ControlledCheckboxDemo() {
  const [checked, setChecked] = useState(true);
  return <Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} />;
}

export const Controlled: Story = {
  render: () => (
    <Section title="Controlled Checkbox" description="Checkbox with controlled state management.">
      <Row>
        <ControlledCheckboxDemo />
      </Row>
    </Section>
  ),
};

export const ColorsAndSizes: Story = {
  render: () => (
    <>
      <Section title="Color Variants" description="Checkboxes with different color props.">
        <Row>
          <Checkbox defaultChecked color="primary" />
          <Checkbox defaultChecked color="secondary" />
          <Checkbox defaultChecked color="default" />
        </Row>
      </Section>
      <Section title="Size Variants" description="Checkboxes in different sizes (small, medium).">
        <Row>
          <Checkbox defaultChecked size="small" />
          <Checkbox defaultChecked size="medium" />
        </Row>
      </Section>
    </>
  ),
};

export const WithLabels: Story = {
  render: () => (
    <Section
      title="With Labels"
      description="Checkboxes with FormControlLabel for better accessibility."
    >
      <FormGroup>
        <FormControlLabel
          control={<Checkbox defaultChecked />}
          label="Accept terms and conditions"
        />
        <FormControlLabel control={<Checkbox />} label="Subscribe to newsletter" />
        <FormControlLabel control={<Checkbox disabled />} label="Disabled option" />
        <FormControlLabel control={<Checkbox disabled checked />} label="Disabled checked option" />
      </FormGroup>
    </Section>
  ),
};

export const Indeterminate: Story = {
  render: () => (
    <Section
      title="Indeterminate State"
      description={'Checkbox in indeterminate state, useful for "select all" scenarios.'}
    >
      <Row>
        <Checkbox indeterminate />
        <FormControlLabel control={<Checkbox indeterminate />} label="Select all (some selected)" />
      </Row>
    </Section>
  ),
};

import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { materialParameters, Row, Section } from './storybook-helpers';

/**
 * Material UI Radio with Apollo theme overrides. Features custom colors,
 * focus states, and selection indicators. Consumed directly from
 * `@mui/material` — the Apollo theme overrides style it.
 */
const meta: Meta = {
  title: 'Components/Radio',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <Section title="Basic Radios" description="Standard radio buttons with Apollo theme styling.">
      <Row>
        <Radio defaultChecked />
        <Radio />
        <Radio disabled />
        <Radio disabled checked />
      </Row>
    </Section>
  ),
};

export const ColorVariants: Story = {
  render: () => (
    <Section title="Color Variants" description="Radio buttons with different color props.">
      <Row>
        <Radio defaultChecked color="primary" />
        <Radio defaultChecked color="secondary" />
        <Radio defaultChecked color="default" />
      </Row>
    </Section>
  ),
};

export const SizeVariants: Story = {
  render: () => (
    <Section title="Size Variants" description="Radio buttons in different sizes (small, medium).">
      <Row>
        <Radio defaultChecked size="small" />
        <Radio defaultChecked size="medium" />
      </Row>
    </Section>
  ),
};

function RadioGroupsDemo() {
  const [value, setValue] = useState('option1');
  return (
    <>
      <Section
        title="Radio Group"
        description="Radio buttons grouped together with controlled state."
      >
        <RadioGroup value={value} onChange={(e) => setValue(e.target.value)}>
          <FormControlLabel value="option1" control={<Radio />} label="Option 1" />
          <FormControlLabel value="option2" control={<Radio />} label="Option 2" />
          <FormControlLabel value="option3" control={<Radio />} label="Option 3" />
          <FormControlLabel value="option4" control={<Radio />} label="Disabled option" disabled />
        </RadioGroup>
      </Section>
      <Section title="Horizontal Radio Group" description="Radio buttons arranged horizontally.">
        <RadioGroup row value={value} onChange={(e) => setValue(e.target.value)}>
          <FormControlLabel value="small" control={<Radio />} label="Small" />
          <FormControlLabel value="medium" control={<Radio />} label="Medium" />
          <FormControlLabel value="large" control={<Radio />} label="Large" />
        </RadioGroup>
      </Section>
    </>
  );
}

export const RadioGroups: Story = {
  render: () => <RadioGroupsDemo />,
};

import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { materialParameters, Row, Section } from './storybook-helpers';

/**
 * Material UI Switch with Apollo theme overrides. Features custom colors,
 * focus states, and toggle animations. Consumed directly from
 * `@mui/material` — the Apollo theme overrides style it.
 */
const meta: Meta = {
  title: 'Components/Switch',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <Section
      title="Basic Switches"
      description="Standard toggle switches with Apollo theme styling."
    >
      <Row>
        <Switch defaultChecked />
        <Switch />
        <Switch disabled />
        <Switch disabled checked />
      </Row>
    </Section>
  ),
};

function ControlledSwitchDemo() {
  const [checked, setChecked] = useState(true);
  return (
    <Section title="Controlled Switch" description="Switch with controlled state management.">
      <Row>
        <Switch checked={checked} onChange={(e) => setChecked(e.target.checked)} />
      </Row>
    </Section>
  );
}

export const Controlled: Story = {
  render: () => <ControlledSwitchDemo />,
};

export const WithLabels: Story = {
  render: () => (
    <Section
      title="With Labels"
      description="Switches with FormControlLabel for better accessibility."
    >
      <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
        <FormControlLabel control={<Switch defaultChecked />} label="Enable notifications" />
        <FormControlLabel control={<Switch />} label="Enable dark mode" />
        <FormControlLabel control={<Switch disabled />} label="Disabled option" />
        <FormControlLabel control={<Switch disabled checked />} label="Disabled checked option" />
      </Stack>
    </Section>
  ),
};

export const LabelPlacement: Story = {
  render: () => (
    <Section title="Label Placement" description="Switches with different label placements.">
      <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
        <FormControlLabel
          control={<Switch defaultChecked />}
          label="Label on the right"
          labelPlacement="end"
        />
        <FormControlLabel
          control={<Switch defaultChecked />}
          label="Label on the left"
          labelPlacement="start"
        />
        <FormControlLabel
          control={<Switch defaultChecked />}
          label="Label on top"
          labelPlacement="top"
        />
        <FormControlLabel
          control={<Switch defaultChecked />}
          label="Label on bottom"
          labelPlacement="bottom"
        />
      </Stack>
    </Section>
  ),
};

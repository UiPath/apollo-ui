import { LinearProgress, Stack } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { materialParameters, Section } from './storybook-helpers';

/**
 * `LinearProgress` from `@mui/material`, styled by the Apollo theme overrides.
 * Features custom colors and variants for progress bars.
 */
const meta: Meta = {
  title: 'Components/Linear Progress',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Indeterminate: Story = {
  render: () => (
    <Section
      title="Indeterminate Progress"
      description="Standard linear progress bar (indeterminate)."
    >
      <Stack spacing={3} sx={{ maxWidth: 500 }}>
        <LinearProgress />
      </Stack>
    </Section>
  ),
};

export const ColorVariants: Story = {
  render: () => (
    <Section title="Color Variants" description="Linear progress with different color props.">
      <Stack spacing={3} sx={{ maxWidth: 500 }}>
        <LinearProgress color="primary" />
        <LinearProgress color="secondary" />
        <LinearProgress color="success" />
        <LinearProgress color="error" />
        <LinearProgress color="warning" />
        <LinearProgress color="info" />
      </Stack>
    </Section>
  ),
};

export const Determinate: Story = {
  render: () => (
    <Section
      title="Determinate Progress"
      description="Linear progress with specific values (determinate)."
    >
      <Stack spacing={3} sx={{ maxWidth: 500 }}>
        <LinearProgress variant="determinate" value={25} />
        <LinearProgress variant="determinate" value={50} />
        <LinearProgress variant="determinate" value={75} />
        <LinearProgress variant="determinate" value={100} />
      </Stack>
    </Section>
  ),
};

export const Buffer: Story = {
  render: () => (
    <Section
      title="Buffer Variant"
      description="Linear progress with buffer showing download progress."
    >
      <Stack spacing={3} sx={{ maxWidth: 500 }}>
        <LinearProgress variant="buffer" value={60} valueBuffer={80} />
      </Stack>
    </Section>
  ),
};

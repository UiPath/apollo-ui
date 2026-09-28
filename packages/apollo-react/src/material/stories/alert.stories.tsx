import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import type { Meta, StoryObj } from '@storybook/react';
import { materialParameters, Section } from './storybook-helpers';

/**
 * Material UI Alert component with Apollo theme overrides. Features custom
 * severity colors, icons, and close button styling.
 */
const meta: Meta = {
  title: 'Components/Alert',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const SeverityVariants: Story = {
  render: () => (
    <Section
      title="Severity Variants"
      description="Alerts with different severity levels (error, warning, info, success)."
    >
      <Stack spacing={2}>
        <Alert severity="error">This is an error alert</Alert>
        <Alert severity="warning">This is a warning alert</Alert>
        <Alert severity="info">This is an info alert</Alert>
        <Alert severity="success">This is a success alert</Alert>
      </Stack>
    </Section>
  ),
};

export const OutlinedVariant: Story = {
  render: () => (
    <Section
      title="Outlined Variant"
      description="Alerts with outlined style instead of filled background."
    >
      <Stack spacing={2}>
        <Alert variant="outlined" severity="error">
          This is an outlined error alert
        </Alert>
        <Alert variant="outlined" severity="warning">
          This is an outlined warning alert
        </Alert>
        <Alert variant="outlined" severity="info">
          This is an outlined info alert
        </Alert>
        <Alert variant="outlined" severity="success">
          This is an outlined success alert
        </Alert>
      </Stack>
    </Section>
  ),
};

export const FilledVariant: Story = {
  render: () => (
    <Section title="Filled Variant" description="Alerts with filled style for higher emphasis.">
      <Stack spacing={2}>
        <Alert variant="filled" severity="error">
          This is a filled error alert
        </Alert>
        <Alert variant="filled" severity="warning">
          This is a filled warning alert
        </Alert>
        <Alert variant="filled" severity="info">
          This is a filled info alert
        </Alert>
        <Alert variant="filled" severity="success">
          This is a filled success alert
        </Alert>
      </Stack>
    </Section>
  ),
};

export const WithCloseButton: Story = {
  render: () => (
    <Section title="With Close Button" description="Alerts with a close button for dismissal.">
      <Stack spacing={2}>
        <Alert severity="info" onClose={() => {}}>
          This alert can be closed
        </Alert>
        <Alert variant="outlined" severity="warning" onClose={() => {}}>
          This outlined alert can be closed
        </Alert>
      </Stack>
    </Section>
  ),
};

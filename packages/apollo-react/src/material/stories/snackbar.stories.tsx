import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { materialParameters, Section } from './storybook-helpers';

/**
 * Material UI Snackbar with Apollo theme overrides. Features custom styling
 * for notifications and toast messages. Consumed directly from
 * `@mui/material` — the Apollo theme overrides style it.
 */
const meta: Meta = {
  title: 'Components/Snackbar',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

function BasicSnackbarDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Section
      title="Basic Snackbar"
      description="Standard snackbar notification with Apollo theme styling."
    >
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Show Snackbar
      </Button>
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={() => setOpen(false)}
        message="This is a snackbar notification"
      />
    </Section>
  );
}

export const Basic: Story = {
  render: () => <BasicSnackbarDemo />,
};

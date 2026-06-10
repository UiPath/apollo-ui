import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { materialParameters, Section } from './storybook-helpers';

/**
 * `Dialog` from `@mui/material` styled by the Apollo theme overrides.
 * Features custom styling for modals, alerts, and confirmation dialogs.
 */
const meta: Meta = {
  title: 'Components/Dialog',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

function BasicDialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Open Dialog
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Dialog Title</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This is a dialog with Apollo theme overrides. It features custom styling for the title,
            content, and actions.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => setOpen(false)} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export const BasicDialog: Story = {
  render: () => (
    <Section title="Basic Dialog" description="Standard dialog with Apollo theme styling.">
      <BasicDialogDemo />
    </Section>
  ),
};

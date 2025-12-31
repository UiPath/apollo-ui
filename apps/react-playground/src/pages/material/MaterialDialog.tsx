import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useState } from 'react';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SectionDescription,
  SectionHeader,
} from '../../components/SharedStyles';

export function MaterialDialog() {
  const [open, setOpen] = useState(false);

  return (
    <PageContainer>
      <PageTitle>Dialog</PageTitle>
      <PageDescription>
        Material UI Dialog component with Apollo theme overrides. Features custom styling for
        modals, alerts, and confirmation dialogs.
      </PageDescription>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>Basic Dialog</SectionHeader>
        <SectionDescription>Standard dialog with Apollo theme styling.</SectionDescription>
        <Button variant="outlined" onClick={() => setOpen(true)}>
          Open Dialog
        </Button>
        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This is a dialog with Apollo theme overrides. It features custom styling for the
              title, content, and actions.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => setOpen(false)} variant="contained">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </section>
    </PageContainer>
  );
}

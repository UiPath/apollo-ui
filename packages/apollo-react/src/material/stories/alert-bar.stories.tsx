import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import type { AlertBarStatus } from '../components';
import { ApAlertBar, ApButton, StatusTypes } from '../components';
import { materialParameters, Section } from './storybook-helpers';

/**
 * `ApAlertBar` from `@uipath/apollo-react/material/components`.
 *
 * Notification component for displaying alerts and messages with different
 * severity levels. Each alert below is dismissible — dismiss it and a button
 * appears to bring it back.
 */
const meta: Meta = {
  title: 'Components/Alert Bar',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

function DismissibleAlert({
  label,
  status,
  children,
}: {
  label: string;
  status: AlertBarStatus;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>{label}</Box>
      {open ? (
        <ApAlertBar status={status} onCancel={() => setOpen(false)}>
          {children}
        </ApAlertBar>
      ) : (
        <ApButton label="Show alert" variant="secondary" onClick={() => setOpen(true)} />
      )}
    </Box>
  );
}

export const Variants: Story = {
  render: () => (
    <Section title="Variants" description="All severity levels with short messages.">
      <DismissibleAlert label="Success alert" status={StatusTypes.SUCCESS}>
        Operation completed successfully!
      </DismissibleAlert>
      <DismissibleAlert label="Error alert" status={StatusTypes.ERROR}>
        An error occurred. Please try again.
      </DismissibleAlert>
      <DismissibleAlert label="Warning alert" status={StatusTypes.WARNING}>
        This action cannot be undone.
      </DismissibleAlert>
      <DismissibleAlert label="Info alert" status={StatusTypes.INFO}>
        Here&apos;s some helpful information for you.
      </DismissibleAlert>
    </Section>
  ),
};

export const LongText: Story = {
  render: () => (
    <Section title="Long Text" description="Alerts wrapping multi-sentence messages.">
      <DismissibleAlert label="Success with long message" status={StatusTypes.SUCCESS}>
        Your operation has been completed successfully! All validation checks have passed, the data
        has been saved to the database, and notifications have been sent to all relevant team
        members. You can now proceed to the next step in your workflow.
      </DismissibleAlert>
      <DismissibleAlert label="Error with detailed explanation" status={StatusTypes.ERROR}>
        An error occurred while processing your request. The server returned status code 500
        indicating an internal server error. This could be due to a temporary issue with the backend
        service. Please wait a few moments and try again. If the problem persists, contact support
        with error reference #ERR-2024-12345.
      </DismissibleAlert>
      <DismissibleAlert label="Warning with multiple sentences" status={StatusTypes.WARNING}>
        This action will permanently delete all associated data and cannot be undone. Please review
        your selection carefully before proceeding. Make sure you have created a backup if needed.
        All related records, attachments, and metadata will be removed from the system immediately.
      </DismissibleAlert>
      <DismissibleAlert label="Info with comprehensive details" status={StatusTypes.INFO}>
        We&apos;ve recently updated our privacy policy and terms of service to comply with new data
        protection regulations. The changes include enhanced security measures, improved data
        handling procedures, and more transparent information about how we collect and use your
        data. Please take a moment to review these updates at your earliest convenience. You can
        find the full documentation in the legal section of our website.
      </DismissibleAlert>
    </Section>
  ),
};

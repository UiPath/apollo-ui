import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react';
import { FontVariantToken } from '@uipath/apollo-core';
import { useState } from 'react';
import { ApButton, ApModal, ApTypography } from '../components';
import { materialParameters, Row, Section } from './storybook-helpers';

/**
 * `ApModal` from `@uipath/apollo-react/material/components` — a centered
 * overlay dialog that displays content above the main page, requiring user
 * interaction before returning to the main workflow. Modals are used for
 * critical information, confirmations, or form inputs.
 *
 * ```ts
 * import { ApModal } from '@uipath/apollo-react/material/components';
 * ```
 */
const meta: Meta = {
  title: 'Components/Modal',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

function BasicModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ApButton label="Open Basic Modal" onClick={() => setOpen(true)} />
      <ApModal
        open={open}
        onClose={() => setOpen(false)}
        header="Basic Modal"
        message="This is a basic modal with default configuration. Click the close button, press ESC, or click outside to dismiss."
      />
    </>
  );
}

function WithActionsDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ApButton label="Open Modal with Actions" onClick={() => setOpen(true)} />
      <ApModal
        open={open}
        onClose={() => setOpen(false)}
        header="Modal with Actions"
        message="This modal includes action buttons at the bottom. The primary action confirms the operation, while the secondary action cancels."
        primaryAction={{
          label: 'Confirm',
          onClick: () => setOpen(false),
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setOpen(false),
        }}
      />
    </>
  );
}

function LoadingStatesDemo() {
  const [open, setOpen] = useState(false);
  const [primaryLoading, setPrimaryLoading] = useState(false);
  const [secondaryLoading, setSecondaryLoading] = useState(false);

  const handlePrimaryAction = () => {
    setPrimaryLoading(true);
    // Simulate async operation (e.g., API call)
    setTimeout(() => {
      setPrimaryLoading(false);
      setOpen(false);
    }, 2000);
  };

  const handleSecondaryAction = () => {
    setSecondaryLoading(true);
    // Simulate async operation
    setTimeout(() => {
      setSecondaryLoading(false);
      setOpen(false);
    }, 1500);
  };

  return (
    <>
      <ApButton label="Open Modal with Loading States" onClick={() => setOpen(true)} />
      <ApModal
        open={open}
        onClose={() => setOpen(false)}
        header="Loading State Example"
        message="Click an action button to see the loading state in action. The parent component controls the loading state and modal closure."
        primaryAction={{
          label: 'Save',
          onClick: handlePrimaryAction,
          loading: primaryLoading,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: handleSecondaryAction,
          loading: secondaryLoading,
        }}
      />
    </>
  );
}

function DisabledStatesDemo() {
  const [primaryDisabledOpen, setPrimaryDisabledOpen] = useState(false);
  const [secondaryDisabledOpen, setSecondaryDisabledOpen] = useState(false);
  return (
    <>
      <ApButton label="Disabled Primary Button" onClick={() => setPrimaryDisabledOpen(true)} />
      <ApButton label="Disabled Secondary Button" onClick={() => setSecondaryDisabledOpen(true)} />
      <ApModal
        open={primaryDisabledOpen}
        onClose={() => setPrimaryDisabledOpen(false)}
        header="Disabled Primary Action"
        message="The primary action button is disabled. This is common when form validation fails or required conditions aren't met."
        primaryAction={{
          label: 'Submit',
          onClick: () => setPrimaryDisabledOpen(false),
          disabled: true,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setPrimaryDisabledOpen(false),
        }}
      />
      <ApModal
        open={secondaryDisabledOpen}
        onClose={() => setSecondaryDisabledOpen(false)}
        header="Disabled Secondary Action"
        message="The secondary action button is disabled. This can be used to enforce a specific workflow or prevent cancellation."
        primaryAction={{
          label: 'Confirm',
          onClick: () => setSecondaryDisabledOpen(false),
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setSecondaryDisabledOpen(false),
          disabled: true,
        }}
      />
    </>
  );
}

function SizesDemo() {
  const [smallOpen, setSmallOpen] = useState(false);
  const [mediumOpen, setMediumOpen] = useState(false);
  const [largeOpen, setLargeOpen] = useState(false);
  return (
    <>
      <ApButton label="Small Modal" onClick={() => setSmallOpen(true)} />
      <ApButton label="Medium Modal" onClick={() => setMediumOpen(true)} />
      <ApButton label="Large Modal" onClick={() => setLargeOpen(true)} />
      <ApModal
        open={smallOpen}
        onClose={() => setSmallOpen(false)}
        header="Small Modal"
        size="small"
        message="This is a small modal with 480px width."
      />
      <ApModal
        open={mediumOpen}
        onClose={() => setMediumOpen(false)}
        header="Medium Modal"
        size="medium"
        message="This is a medium modal with 600px width."
      />
      <ApModal
        open={largeOpen}
        onClose={() => setLargeOpen(false)}
        header="Large Modal"
        size="large"
        message="This is a large modal with 800px width."
      />
    </>
  );
}

function CustomContentDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ApButton label="Open Modal with Custom Content" onClick={() => setOpen(true)} />
      <ApModal open={open} onClose={() => setOpen(false)} header="Custom Content Modal">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <ApTypography variant={FontVariantToken.fontSizeH4Bold}>Custom Heading</ApTypography>
          <ApTypography variant={FontVariantToken.fontSizeM}>
            This modal contains custom React content instead of a simple message. You can add any
            components, forms, or interactive elements here.
          </ApTypography>
          <ApTypography variant={FontVariantToken.fontSizeS}>
            The modal provides a flexible container for complex UI patterns while maintaining
            consistent styling and behavior.
          </ApTypography>
        </Box>
      </ApModal>
    </>
  );
}

function PreventCloseDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ApButton label="Open Non-Dismissible Modal" onClick={() => setOpen(true)} />
      <ApModal
        open={open}
        onClose={() => setOpen(false)}
        header="Non-Dismissible Modal"
        message="This modal cannot be dismissed by clicking outside or pressing ESC. You must use the action buttons to close it."
        preventClose
        primaryAction={{
          label: 'Close',
          onClick: () => setOpen(false),
        }}
      />
    </>
  );
}

function HideCloseButtonDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ApButton label="Open Modal without Close Button" onClick={() => setOpen(true)} />
      <ApModal
        open={open}
        onClose={() => setOpen(false)}
        header="No Close Button"
        message="This modal doesn't have a close button in the corner. You can click outside or use the action button below."
        hideCloseButton
        primaryAction={{
          label: 'Close',
          onClick: () => setOpen(false),
        }}
      />
    </>
  );
}

export const Basic: Story = {
  render: () => (
    <Section title="Basic Modal" description="Default modal with header and message.">
      <Row>
        <BasicModalDemo />
      </Row>
    </Section>
  ),
};

export const WithActions: Story = {
  render: () => (
    <Section title="With Actions" description="Modal with primary and secondary action buttons.">
      <Row>
        <WithActionsDemo />
      </Row>
    </Section>
  ),
};

export const LoadingAndDisabledStates: Story = {
  render: () => (
    <>
      <Section
        title="Loading States"
        description="Action buttons with loading states for async operations."
      >
        <Row>
          <LoadingStatesDemo />
        </Row>
      </Section>
      <Section
        title="Disabled States"
        description="Action buttons can be disabled to prevent user interaction based on conditions (e.g., form validation, permissions, workflow enforcement)."
      >
        <Row>
          <DisabledStatesDemo />
        </Row>
      </Section>
    </>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Section
      title="Modal Sizes"
      description="Different modal widths: small (480px), medium (600px), large (800px)."
    >
      <Row>
        <SizesDemo />
      </Row>
    </Section>
  ),
};

export const CustomContent: Story = {
  render: () => (
    <Section
      title="Custom Content"
      description="Modal with custom React content instead of a message."
    >
      <Row>
        <CustomContentDemo />
      </Row>
    </Section>
  ),
};

export const DismissBehavior: Story = {
  render: () => (
    <>
      <Section
        title="Prevent Close"
        description="Modal that cannot be closed by clicking outside or pressing ESC (must use action buttons)."
      >
        <Row>
          <PreventCloseDemo />
        </Row>
      </Section>
      <Section
        title="Hide Close Button"
        description="Modal without close button (relies on actions or backdrop)."
      >
        <Row>
          <HideCloseButtonDemo />
        </Row>
      </Section>
    </>
  ),
};

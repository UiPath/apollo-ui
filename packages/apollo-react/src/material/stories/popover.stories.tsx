import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ApButton, ApPopover } from '../components';
import { materialParameters, Row, Section } from './storybook-helpers';

/**
 * `ApPopover` from `@uipath/apollo-react/material/components` — a floating
 * element that displays content when triggered by a user action. Popovers
 * provide contextual information or options, enhancing user interaction
 * without navigating away from the current page.
 *
 * ```ts
 * import { ApPopover } from '@uipath/apollo-react/material/components';
 * ```
 */
const meta: Meta = {
  title: 'Components/Popover',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

function BasicPopoverDemo() {
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  return (
    <>
      <ApButton
        aria-describedby="simple-popover"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        label="Show Popover"
        type="button"
      />
      <ApPopover
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        id="simple-popover"
        onClose={() => setAnchorEl(null)}
      >
        <Box sx={{ p: 2, maxWidth: 200 }}>
          This is a basic popover example positioned below and to the left of the anchor point.
        </Box>
      </ApPopover>
    </>
  );
}

function CustomPositioningDemo() {
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  return (
    <>
      <ApButton
        aria-describedby="custom-popover"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        label="Show Popover"
        type="button"
      />
      <ApPopover
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        id="custom-popover"
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, maxWidth: 200 }}>
          This popover is positioned above and to the right of the anchor point.
        </Box>
      </ApPopover>
    </>
  );
}

function PositionOffsetsDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ApButton
        aria-describedby="offset-popover"
        onClick={() => setOpen(true)}
        label="Show Popover"
        type="button"
      />
      <ApPopover
        open={open}
        id="offset-popover"
        onClose={() => setOpen(false)}
        anchorPosition={{ top: 20, left: 50 }}
      >
        <Box sx={{ p: 2, maxWidth: 200 }}>
          This popover is offset by 20px vertically and 50px horizontally from application area.
        </Box>
      </ApPopover>
    </>
  );
}

export const Basic: Story = {
  render: () => (
    <Section
      title="Default"
      description="Basic popover anchored to a button, positioned below and to the left of the anchor point."
    >
      <Row>
        <BasicPopoverDemo />
      </Row>
    </Section>
  ),
};

export const CustomPositioning: Story = {
  render: () => (
    <Section
      title="Anchor Position and Transform Origin"
      description="Popover positioned above and to the right of the anchor point via anchorOrigin and transformOrigin."
    >
      <Row>
        <CustomPositioningDemo />
      </Row>
    </Section>
  ),
};

export const PositionOffsets: Story = {
  render: () => (
    <Section
      title="Popover Position Offsets"
      description="Popover positioned at fixed coordinates from the application area via anchorPosition."
    >
      <Row>
        <PositionOffsetsDemo />
      </Row>
    </Section>
  ),
};

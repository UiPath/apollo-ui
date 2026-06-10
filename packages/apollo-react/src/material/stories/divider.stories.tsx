import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react';
import { materialParameters, Section } from './storybook-helpers';

/**
 * `Divider` from `@mui/material` styled by the Apollo theme overrides.
 * Provides horizontal and vertical dividers for content separation.
 */
const meta: Meta = {
  title: 'Components/Divider',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Horizontal: Story = {
  render: () => (
    <Section
      title="Horizontal Divider"
      description="Standard horizontal divider with Apollo theme styling."
    >
      <Box sx={{ maxWidth: 500 }}>
        <Divider />
      </Box>
    </Section>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Section
      title="Vertical Divider"
      description="Vertical dividers for separating inline content."
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Typography component="span">Item 1</Typography>
        <Divider orientation="vertical" flexItem />
        <Typography component="span">Item 2</Typography>
        <Divider orientation="vertical" flexItem />
        <Typography component="span">Item 3</Typography>
      </Stack>
    </Section>
  ),
};

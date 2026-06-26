import { InputAdornment, InputBase, Stack } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { Search } from '../../icons';
import { materialParameters, Section } from './storybook-helpers';

/**
 * `InputBase` from `@mui/material`, styled by the Apollo theme overrides. A
 * foundational unstyled input component used as the base for other input
 * variants. Note: InputBase is intentionally minimal and requires custom
 * styling for production use.
 */
const meta: Meta = {
  title: 'Components/Input Base',
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
      title="Basic InputBase"
      description="Unstyled input component demonstrating the minimal primitive nature of InputBase."
    >
      <Stack spacing={3} alignItems="flex-start">
        <InputBase placeholder="Enter your name" sx={{ minWidth: 300 }} />
        <InputBase placeholder="Email address" type="email" sx={{ minWidth: 300 }} />
      </Stack>
    </Section>
  ),
};

export const WithAdornments: Story = {
  render: () => (
    <Section title="With Adornments" description="InputBase with start and end adornments.">
      <Stack spacing={3} alignItems="flex-start">
        <InputBase
          placeholder="Search..."
          startAdornment={
            <InputAdornment position="start">
              <Search size={18} />
            </InputAdornment>
          }
          sx={{ minWidth: 300 }}
        />
        <InputBase
          placeholder="Amount"
          startAdornment={<InputAdornment position="start">$</InputAdornment>}
          endAdornment={<InputAdornment position="end">.00</InputAdornment>}
          sx={{ minWidth: 300 }}
        />
      </Stack>
    </Section>
  ),
};

export const Multiline: Story = {
  render: () => (
    <Section title="Multiline" description="InputBase with multiline support (textarea).">
      <InputBase placeholder="Enter your message..." multiline rows={4} sx={{ minWidth: 300 }} />
    </Section>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Section title="Disabled State" description="InputBase in disabled state.">
      <InputBase
        placeholder="Disabled input"
        disabled
        defaultValue="Cannot edit"
        sx={{ minWidth: 300 }}
      />
    </Section>
  ),
};

import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import type { Meta, StoryObj } from '@storybook/react';
import { materialParameters, Section } from './storybook-helpers';

/**
 * Material UI Autocomplete component with Apollo theme overrides. Features
 * custom dropdown styling, chip rendering, and search functionality.
 */
const meta: Meta = {
  title: 'Components/Autocomplete',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const options = ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5'];

export const Basic: Story = {
  render: () => (
    <Section
      title="Basic Autocomplete"
      description="Standard autocomplete with Apollo theme styling."
    >
      <Autocomplete
        options={options}
        sx={{ maxWidth: 400 }}
        renderInput={(params) => <TextField {...params} label="Select option" />}
      />
    </Section>
  ),
};

export const MultipleSelection: Story = {
  render: () => (
    <Section title="Multiple Selection" description="Autocomplete allowing multiple selections.">
      <Autocomplete
        multiple
        options={options}
        sx={{ maxWidth: 400 }}
        renderInput={(params) => <TextField {...params} label="Select multiple" />}
      />
    </Section>
  ),
};

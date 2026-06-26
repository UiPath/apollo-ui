import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { materialParameters, Row, Section } from './storybook-helpers';

/**
 * Material UI Select with Apollo theme overrides. Features custom dropdown
 * styling, menu items, and focus states. Consumed directly from
 * `@mui/material` — the Apollo theme overrides style it.
 */
const meta: Meta = {
  title: 'Components/Select',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

function BasicSelectDemo() {
  const [value, setValue] = useState('10');
  return (
    <Section title="Basic Select" description="Standard select dropdown with Apollo theme styling.">
      <Row>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Age</InputLabel>
          <Select
            value={value}
            label="Age"
            onChange={(e: SelectChangeEvent) => setValue(e.target.value)}
          >
            <MenuItem value="10">Ten</MenuItem>
            <MenuItem value="20">Twenty</MenuItem>
            <MenuItem value="30">Thirty</MenuItem>
          </Select>
        </FormControl>
      </Row>
    </Section>
  );
}

export const Basic: Story = {
  render: () => <BasicSelectDemo />,
};

function SizeVariantsDemo() {
  const [value, setValue] = useState('10');
  return (
    <Section
      title="Size Variants"
      description="Select components in different sizes (small, medium)."
    >
      <Row>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Small</InputLabel>
          <Select
            value={value}
            label="Small"
            onChange={(e: SelectChangeEvent) => setValue(e.target.value)}
          >
            <MenuItem value="10">Option 1</MenuItem>
            <MenuItem value="20">Option 2</MenuItem>
            <MenuItem value="30">Option 3</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Medium</InputLabel>
          <Select
            value={value}
            label="Medium"
            onChange={(e: SelectChangeEvent) => setValue(e.target.value)}
          >
            <MenuItem value="10">Option 1</MenuItem>
            <MenuItem value="20">Option 2</MenuItem>
            <MenuItem value="30">Option 3</MenuItem>
          </Select>
        </FormControl>
      </Row>
    </Section>
  );
}

export const Sizes: Story = {
  render: () => <SizeVariantsDemo />,
};

function StyleVariantsDemo() {
  const [value, setValue] = useState('10');
  return (
    <Section
      title="Variants"
      description="Select with different style variants (outlined, filled, standard)."
    >
      <Row>
        <FormControl variant="outlined" sx={{ minWidth: 150 }}>
          <InputLabel>Outlined</InputLabel>
          <Select
            value={value}
            label="Outlined"
            onChange={(e: SelectChangeEvent) => setValue(e.target.value)}
          >
            <MenuItem value="10">Option 1</MenuItem>
            <MenuItem value="20">Option 2</MenuItem>
            <MenuItem value="30">Option 3</MenuItem>
          </Select>
        </FormControl>
        <FormControl variant="filled" sx={{ minWidth: 150 }}>
          <InputLabel>Filled</InputLabel>
          <Select
            value={value}
            label="Filled"
            onChange={(e: SelectChangeEvent) => setValue(e.target.value)}
          >
            <MenuItem value="10">Option 1</MenuItem>
            <MenuItem value="20">Option 2</MenuItem>
            <MenuItem value="30">Option 3</MenuItem>
          </Select>
        </FormControl>
        <FormControl variant="standard" sx={{ minWidth: 150 }}>
          <InputLabel>Standard</InputLabel>
          <Select
            value={value}
            label="Standard"
            onChange={(e: SelectChangeEvent) => setValue(e.target.value)}
          >
            <MenuItem value="10">Option 1</MenuItem>
            <MenuItem value="20">Option 2</MenuItem>
            <MenuItem value="30">Option 3</MenuItem>
          </Select>
        </FormControl>
      </Row>
    </Section>
  );
}

export const Variants: Story = {
  render: () => <StyleVariantsDemo />,
};

function MultipleSelectDemo() {
  const [value, setValue] = useState<string[]>([]);
  return (
    <Section title="Multiple Select" description="Select component allowing multiple selections.">
      <FormControl sx={{ minWidth: 250 }}>
        <InputLabel>Select tags</InputLabel>
        <Select
          multiple
          value={value}
          label="Select tags"
          onChange={(e: SelectChangeEvent<string[]>) =>
            setValue(
              typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
            )
          }
        >
          <MenuItem value="react">React</MenuItem>
          <MenuItem value="angular">Angular</MenuItem>
          <MenuItem value="vue">Vue</MenuItem>
          <MenuItem value="svelte">Svelte</MenuItem>
        </Select>
      </FormControl>
    </Section>
  );
}

export const MultipleSelect: Story = {
  render: () => <MultipleSelectDemo />,
};

export const Disabled: Story = {
  render: () => (
    <Section title="Disabled State" description="Select component in disabled state.">
      <FormControl disabled sx={{ minWidth: 200 }}>
        <InputLabel>Disabled</InputLabel>
        <Select value="10" label="Disabled">
          <MenuItem value="10">Option 1</MenuItem>
          <MenuItem value="20">Option 2</MenuItem>
          <MenuItem value="30">Option 3</MenuItem>
        </Select>
      </FormControl>
    </Section>
  ),
};

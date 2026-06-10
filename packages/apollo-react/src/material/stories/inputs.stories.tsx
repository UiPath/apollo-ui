import {
  FormControl,
  FormHelperText,
  IconButton,
  Input,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Search, VisibilityOff, VisibilityOnPreview } from '../../icons';
import { materialParameters, Section } from './storybook-helpers';

/**
 * Material UI input building blocks (`InputLabel`, `InputAdornment`,
 * `OutlinedInput`, `Input`, `TextField`) styled by the Apollo theme overrides.
 * These components work together to create accessible and styled input fields.
 */
const meta: Meta = {
  title: 'Components/Inputs',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

function AmountAdornmentDemo() {
  const [amount, setAmount] = useState('100');
  return (
    <TextField
      label="Amount"
      value={amount}
      onChange={(e) => setAmount(e.target.value)}
      InputProps={{
        startAdornment: <InputAdornment position="start">$</InputAdornment>,
      }}
      sx={{ minWidth: 300 }}
    />
  );
}

function PasswordAdornmentDemo() {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <FormControl variant="outlined" sx={{ minWidth: 300 }}>
      <InputLabel htmlFor="password-input">Password</InputLabel>
      <OutlinedInput
        id="password-input"
        type={showPassword ? 'text' : 'password'}
        label="Password"
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={() => setShowPassword(!showPassword)}
              edge="end"
            >
              {showPassword ? <VisibilityOff size={20} /> : <VisibilityOnPreview size={20} />}
            </IconButton>
          </InputAdornment>
        }
      />
    </FormControl>
  );
}

function AgeSelectDemo() {
  const [age, setAge] = useState('');
  return (
    <FormControl variant="outlined" sx={{ minWidth: 300 }}>
      <InputLabel id="age-select-label">Age</InputLabel>
      <Select
        labelId="age-select-label"
        value={age}
        label="Age"
        onChange={(e) => setAge(e.target.value)}
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        <MenuItem value={10}>Ten</MenuItem>
        <MenuItem value={20}>Twenty</MenuItem>
        <MenuItem value={30}>Thirty</MenuItem>
      </Select>
    </FormControl>
  );
}

export const BasicOutlined: Story = {
  render: () => (
    <Section
      title="Basic Outlined Inputs"
      description="Standard outlined inputs with labels using OutlinedInput and InputLabel."
    >
      <Stack spacing={3} alignItems="flex-start">
        <FormControl variant="outlined" sx={{ minWidth: 300 }}>
          <InputLabel htmlFor="name-input">Full Name</InputLabel>
          <OutlinedInput id="name-input" label="Full Name" />
        </FormControl>
        <FormControl variant="outlined" sx={{ minWidth: 300 }}>
          <InputLabel htmlFor="email-input">Email Address</InputLabel>
          <OutlinedInput id="email-input" type="email" label="Email Address" />
        </FormControl>
      </Stack>
    </Section>
  ),
};

export const WithAdornments: Story = {
  render: () => (
    <>
      <Section
        title="With Adornments"
        description="Input fields with icons or text positioned at the start or end using InputAdornment."
      >
        <Stack spacing={3} alignItems="flex-start">
          <AmountAdornmentDemo />
          <TextField
            label="Website URL"
            defaultValue="mysite"
            InputProps={{
              endAdornment: <InputAdornment position="end">.com</InputAdornment>,
            }}
            sx={{ minWidth: 300 }}
          />
          <TextField
            label="Search"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />
        </Stack>
      </Section>
      <Section
        title="Interactive Adornment"
        description="Adornments with interactive elements like password visibility toggle."
      >
        <PasswordAdornmentDemo />
      </Section>
    </>
  ),
};

export const StandardVariant: Story = {
  render: () => (
    <Section
      title="Standard (Underlined) Inputs"
      description="Alternative input variant with bottom border only."
    >
      <Stack direction="row" spacing={3} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <FormControl variant="standard" sx={{ minWidth: 300 }}>
          <InputLabel htmlFor="standard-name">Name</InputLabel>
          <Input id="standard-name" />
        </FormControl>
        <FormControl variant="standard" sx={{ minWidth: 300 }}>
          <InputLabel htmlFor="price-input">Price</InputLabel>
          <Input
            id="price-input"
            startAdornment={<InputAdornment position="start">$</InputAdornment>}
            endAdornment={<InputAdornment position="end">USD</InputAdornment>}
            defaultValue="99"
          />
        </FormControl>
      </Stack>
    </Section>
  ),
};

export const WithSelect: Story = {
  render: () => (
    <Section title="With Select" description="InputLabel providing context for Select components.">
      <AgeSelectDemo />
    </Section>
  ),
};

export const MultilineAndSizes: Story = {
  render: () => (
    <>
      <Section
        title="Multiline"
        description="Outlined input with multiline support for longer text content."
      >
        <FormControl variant="outlined" sx={{ minWidth: 300 }}>
          <InputLabel htmlFor="multiline-input">Description</InputLabel>
          <OutlinedInput
            id="multiline-input"
            label="Description"
            multiline
            rows={4}
            placeholder="Enter a detailed description..."
          />
        </FormControl>
      </Section>
      <Section title="Sizes" description="Input fields in different sizes (small and medium).">
        <Stack spacing={3} alignItems="flex-start">
          <FormControl variant="outlined" size="small" sx={{ minWidth: 300 }}>
            <InputLabel htmlFor="small-input">Small</InputLabel>
            <OutlinedInput id="small-input" label="Small" />
          </FormControl>
          <FormControl variant="outlined" sx={{ minWidth: 300 }}>
            <InputLabel htmlFor="medium-input">Medium (default)</InputLabel>
            <OutlinedInput id="medium-input" label="Medium (default)" />
          </FormControl>
        </Stack>
      </Section>
    </>
  ),
};

export const States: Story = {
  render: () => (
    <>
      <Section
        title="Required State"
        description="Input fields with required indicator (asterisk)."
      >
        <FormControl variant="outlined" required sx={{ minWidth: 300 }}>
          <InputLabel htmlFor="required-input">Username</InputLabel>
          <OutlinedInput id="required-input" label="Username" />
        </FormControl>
      </Section>
      <Section title="Error State" description="Input fields in error state with error messages.">
        <Stack spacing={3} alignItems="flex-start">
          <FormControl error variant="outlined" sx={{ minWidth: 300 }}>
            <InputLabel htmlFor="error-input-1">Username</InputLabel>
            <OutlinedInput id="error-input-1" label="Username" defaultValue="ab" />
            <FormHelperText>Username must be at least 3 characters</FormHelperText>
          </FormControl>
          <FormControl error variant="outlined" sx={{ minWidth: 300 }}>
            <InputLabel htmlFor="error-input-2">Password</InputLabel>
            <OutlinedInput id="error-input-2" type="password" label="Password" defaultValue="123" />
            <FormHelperText>Password must be at least 8 characters</FormHelperText>
          </FormControl>
        </Stack>
      </Section>
      <Section
        title="Disabled State"
        description="Input fields in disabled state with muted styling."
      >
        <FormControl variant="outlined" disabled sx={{ minWidth: 300 }}>
          <InputLabel htmlFor="disabled-input">Account Status</InputLabel>
          <OutlinedInput id="disabled-input" label="Account Status" defaultValue="Verified" />
        </FormControl>
      </Section>
    </>
  ),
};

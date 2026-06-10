import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { materialParameters, Section } from './storybook-helpers';

/**
 * Material UI form components (`FormControl`, `FormLabel`, `FormHelperText`,
 * `FormControlLabel`) with Apollo theme overrides. These components work
 * together to create accessible and well-styled form inputs.
 */
const meta: Meta = {
  title: 'Components/Form Controls',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

function BasicFormControlDemo() {
  const [age, setAge] = useState('');
  return (
    <FormControl sx={{ minWidth: 300 }}>
      <InputLabel>Age</InputLabel>
      <Select value={age} label="Age" onChange={(e) => setAge(e.target.value)}>
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

export const BasicFormControl: Story = {
  render: () => (
    <Section
      title="Basic Form Control"
      description="FormControl wraps form inputs to provide consistent spacing and layout."
    >
      <BasicFormControlDemo />
    </Section>
  ),
};

export const LabelsAndGroups: Story = {
  render: () => (
    <>
      <Section
        title="With FormLabel"
        description="FormLabel provides labels for form groups like radio buttons and checkboxes."
      >
        <Stack direction="row" spacing={6} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <FormControl>
            <FormLabel>Gender</FormLabel>
            <RadioGroup defaultValue="female">
              <FormControlLabel value="female" control={<Radio />} label="Female" />
              <FormControlLabel value="male" control={<Radio />} label="Male" />
              <FormControlLabel value="other" control={<Radio />} label="Other" />
            </RadioGroup>
          </FormControl>

          <FormControl>
            <FormLabel>Notification Preferences</FormLabel>
            <FormGroup>
              <FormControlLabel control={<Checkbox defaultChecked />} label="Email notifications" />
              <FormControlLabel control={<Checkbox />} label="SMS notifications" />
              <FormControlLabel control={<Checkbox defaultChecked />} label="Push notifications" />
            </FormGroup>
          </FormControl>
        </Stack>
      </Section>

      <Section
        title="FormControlLabel"
        description="FormControlLabel wraps form controls (Checkbox, Radio, Switch) with labels."
      >
        <Stack direction="row" spacing={6} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Stack spacing={1}>
            <FormControlLabel control={<Checkbox defaultChecked />} label="Checkbox example" />
            <FormControlLabel control={<Checkbox />} label="Unchecked" />
            <FormControlLabel control={<Checkbox disabled />} label="Disabled" />
          </Stack>

          <Stack spacing={1}>
            <FormControlLabel control={<Switch defaultChecked />} label="Switch example" />
            <FormControlLabel control={<Switch />} label="Dark mode" />
            <FormControlLabel control={<Switch disabled />} label="Disabled" />
          </Stack>
        </Stack>
      </Section>
    </>
  ),
};

export const HelperText: Story = {
  render: () => (
    <Section
      title="With Helper Text"
      description="FormHelperText provides additional context or instructions for form fields."
    >
      <Stack spacing={3} sx={{ maxWidth: 600 }}>
        <TextField
          label="Username"
          helperText="Choose a unique username (3-20 characters)"
          sx={{ minWidth: 300 }}
        />
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel>Country</InputLabel>
          <Select label="Country" defaultValue="">
            <MenuItem value="">
              <em>Select a country</em>
            </MenuItem>
            <MenuItem value="us">United States</MenuItem>
            <MenuItem value="uk">United Kingdom</MenuItem>
            <MenuItem value="ca">Canada</MenuItem>
          </Select>
          <FormHelperText>Select your country of residence</FormHelperText>
        </FormControl>
      </Stack>
    </Section>
  ),
};

export const ValidationStates: Story = {
  render: () => (
    <>
      <Section
        title="Required State"
        description="Form controls with required indicator (asterisk)."
      >
        <Stack direction="row" spacing={6} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <TextField
            required
            label="Username"
            helperText="This field is required"
            sx={{ minWidth: 300 }}
          />

          <FormControl required>
            <FormLabel>Preferred Contact Method</FormLabel>
            <RadioGroup defaultValue="email">
              <FormControlLabel value="email" control={<Radio />} label="Email" />
              <FormControlLabel value="phone" control={<Radio />} label="Phone" />
            </RadioGroup>
          </FormControl>
        </Stack>
      </Section>

      <Section title="Error State" description="Form controls in error state with error messages.">
        <Stack direction="row" spacing={6} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <TextField
            error
            label="Email"
            defaultValue="invalid-email"
            helperText="Please enter a valid email address"
            sx={{ minWidth: 300 }}
          />

          <FormControl error>
            <FormLabel>Age Range (Required)</FormLabel>
            <RadioGroup>
              <FormControlLabel value="under18" control={<Radio />} label="Under 18" />
              <FormControlLabel value="18-65" control={<Radio />} label="18-65" />
              <FormControlLabel value="over65" control={<Radio />} label="Over 65" />
            </RadioGroup>
            <FormHelperText>Please select your age range</FormHelperText>
          </FormControl>
        </Stack>
      </Section>
    </>
  ),
};

export const DisabledState: Story = {
  render: () => (
    <Section
      title="Disabled State"
      description="Form controls in disabled state with muted styling."
    >
      <Stack direction="row" spacing={6} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <FormControl disabled sx={{ minWidth: 300 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" defaultValue="active">
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
          <FormHelperText>This field is disabled</FormHelperText>
        </FormControl>

        <FormControl disabled>
          <FormLabel>Account Type</FormLabel>
          <RadioGroup defaultValue="premium">
            <FormControlLabel value="free" control={<Radio />} label="Free" disabled />
            <FormControlLabel value="premium" control={<Radio />} label="Premium" disabled />
          </RadioGroup>
        </FormControl>
      </Stack>
    </Section>
  ),
};

export const LabelPlacement: Story = {
  render: () => (
    <Section
      title="Label Placement"
      description="FormControlLabel with different label placement options."
    >
      <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
        <FormControlLabel
          control={<Checkbox defaultChecked />}
          label="Label on right (default)"
          labelPlacement="end"
        />
        <FormControlLabel
          control={<Checkbox defaultChecked />}
          label="Label on left"
          labelPlacement="start"
        />
        <FormControlLabel
          control={<Checkbox defaultChecked />}
          label="Label on top"
          labelPlacement="top"
        />
        <FormControlLabel
          control={<Checkbox defaultChecked />}
          label="Label on bottom"
          labelPlacement="bottom"
        />
      </Stack>
    </Section>
  ),
};

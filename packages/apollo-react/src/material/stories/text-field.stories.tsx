import TextField from '@mui/material/TextField';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ApTextField } from '../components';
import { ConsumptionTabs, materialParameters, Row, Section } from './storybook-helpers';

/**
 * Text fields exist on two consumption paths:
 * - `TextField` from `@mui/material` — styled by the Apollo theme overrides
 *   (outlined, filled and standard variants).
 * - `ApTextField` from `@uipath/apollo-react/material/components` — the Apollo
 *   single-line input with `label`, `helperText`, `errorMessage`, `readOnly`
 *   and adornment conveniences.
 */
const meta: Meta = {
  title: 'Components/Text Field',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const MUI_IMPORT = "import { TextField } from '@mui/material';";
const AP_IMPORT = "import { ApTextField } from '@uipath/apollo-react/material/components';";

function MuiVariantsDemo() {
  const [value, setValue] = useState('');
  return (
    <>
      <Row label="Outlined — Apollo border and focus styling">
        <TextField label="Default" variant="outlined" placeholder="Enter text..." />
        <TextField
          label="With Value"
          variant="outlined"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <TextField label="Disabled" variant="outlined" disabled />
        <TextField
          label="Error State"
          variant="outlined"
          error
          helperText="This field has an error"
        />
      </Row>
      <Row label="Filled — background color and subtle borders">
        <TextField label="Default" variant="filled" placeholder="Enter text..." />
        <TextField label="Disabled" variant="filled" disabled />
        <TextField
          label="Error State"
          variant="filled"
          error
          helperText="This field has an error"
        />
      </Row>
      <Row label="Standard — bottom border only">
        <TextField label="Default" variant="standard" placeholder="Enter text..." />
        <TextField label="Disabled" variant="standard" disabled />
        <TextField
          label="Error State"
          variant="standard"
          error
          helperText="This field has an error"
        />
      </Row>
    </>
  );
}

function ApBasicFieldsDemo() {
  const [plain, setPlain] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  return (
    <>
      <Row label="Standard text field">
        <ApTextField value={plain} onChange={setPlain} placeholder="Enter text..." />
      </Row>
      <Row label="With label">
        <ApTextField
          label="Username"
          value={username}
          onChange={setUsername}
          placeholder="Enter your username"
        />
      </Row>
      <Row label="With helper text">
        <ApTextField
          label="Full Name"
          value={fullName}
          onChange={setFullName}
          placeholder="John Doe"
          helperText="Enter your first and last name"
        />
      </Row>
    </>
  );
}

export const Variants: Story = {
  render: () => (
    <ConsumptionTabs
      muiImport={MUI_IMPORT}
      apImport={AP_IMPORT}
      mui={<MuiVariantsDemo />}
      ap={<ApBasicFieldsDemo />}
    />
  ),
};

function ApStatesDemo() {
  const [errorValue, setErrorValue] = useState('');
  const [requiredValue, setRequiredValue] = useState('');
  return (
    <>
      <Row label="Disabled state">
        <ApTextField label="Disabled Field" value="This field is disabled" disabled />
      </Row>
      <Row label="Read-only state">
        <ApTextField
          label="Read Only Field"
          value="This field is read-only"
          readOnly
          readOnlyTooltip="This field cannot be edited"
        />
      </Row>
      <Row label="Error state">
        <ApTextField
          label="Required Field"
          value={errorValue}
          onChange={setErrorValue}
          placeholder="This field is required"
          errorMessage="This field cannot be empty"
        />
      </Row>
      <Row label="Required field">
        <ApTextField
          label="Required Input"
          required
          value={requiredValue}
          onChange={setRequiredValue}
          placeholder="This field is required"
        />
      </Row>
    </>
  );
}

export const States: Story = {
  render: () => (
    <ConsumptionTabs
      muiImport={MUI_IMPORT}
      apImport={AP_IMPORT}
      mui={
        <Row label="Required fields with asterisk indicator">
          <TextField label="Username" variant="outlined" required />
          <TextField label="Email" variant="outlined" required />
          <TextField label="Phone" variant="outlined" required />
        </Row>
      }
      ap={<ApStatesDemo />}
    />
  ),
};

export const SizesAndHelperText: Story = {
  render: () => (
    <ConsumptionTabs
      muiImport={MUI_IMPORT}
      apImport={AP_IMPORT}
      mui={
        <>
          <Row label="Sizes (small / medium)">
            <TextField label="Small" variant="outlined" size="small" />
            <TextField label="Medium" variant="outlined" size="medium" />
          </Row>
          <Row label="With helper text">
            <TextField
              label="Email"
              variant="outlined"
              helperText="Enter your email address"
              placeholder="user@example.com"
            />
            <TextField
              label="Password"
              variant="outlined"
              type="password"
              helperText="Must be at least 8 characters"
            />
          </Row>
        </>
      }
      ap={
        <>
          <Row label="Sizes (tall / small)">
            <ApTextField label="Tall (default)" size="tall" placeholder="Enter text..." />
            <ApTextField label="Small" size="small" placeholder="Enter text..." />
          </Row>
          <Row label="With helper text">
            <ApTextField
              label="Email"
              helperText="Enter your email address"
              placeholder="user@example.com"
            />
          </Row>
        </>
      }
    />
  ),
};

function ApInputTypesDemo() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <>
      <Row label="Email input">
        <ApTextField
          type="email"
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
        />
      </Row>
      <Row label="Password input">
        <ApTextField
          type="password"
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
        />
      </Row>
    </>
  );
}

export const InputTypes: Story = {
  render: () => (
    <Section
      title="Input Types"
      description="ApTextField with typed inputs — the browser input type drives keyboard and masking behavior."
    >
      <ApInputTypesDemo />
    </Section>
  ),
};

export const Multiline: Story = {
  render: () => (
    <Section
      title="Multiline Text Fields"
      description="Text areas with multiple rows for longer text input — MUI TextField only."
    >
      <Row>
        <TextField
          label="Description"
          variant="outlined"
          multiline
          rows={4}
          placeholder="Enter a detailed description..."
          helperText="Maximum 500 characters"
          sx={{ width: 360 }}
        />
        <TextField
          label="Comments"
          variant="outlined"
          multiline
          rows={3}
          placeholder="Add your comments..."
          sx={{ width: 360 }}
        />
      </Row>
    </Section>
  ),
};

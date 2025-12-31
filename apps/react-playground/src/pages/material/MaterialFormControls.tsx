import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SectionDescription,
  SectionHeader,
} from '../../components/SharedStyles';

export function MaterialFormControls() {
  const [age, setAge] = useState('');

  return (
    <PageContainer>
      <PageTitle>Form Controls</PageTitle>
      <PageDescription>
        Material UI form components (FormControl, FormLabel, FormHelperText, FormControlLabel) with
        Apollo theme overrides. These components work together to create accessible and well-styled
        form inputs.
      </PageDescription>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>Basic Form Control</SectionHeader>
        <SectionDescription>
          FormControl wraps form inputs to provide consistent spacing and layout.
        </SectionDescription>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
        </div>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>With FormLabel</SectionHeader>
        <SectionDescription>
          FormLabel provides labels for form groups like radio buttons and checkboxes.
        </SectionDescription>
        <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
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
        </div>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>With Helper Text</SectionHeader>
        <SectionDescription>
          FormHelperText provides additional context or instructions for form fields.
        </SectionDescription>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
        </div>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>FormControlLabel</SectionHeader>
        <SectionDescription>
          FormControlLabel wraps form controls (Checkbox, Radio, Switch) with labels.
        </SectionDescription>
        <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <FormControlLabel control={<Checkbox defaultChecked />} label="Checkbox example" />
            <FormControlLabel control={<Checkbox />} label="Unchecked" />
            <FormControlLabel control={<Checkbox disabled />} label="Disabled" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <FormControlLabel control={<Switch defaultChecked />} label="Switch example" />
            <FormControlLabel control={<Switch />} label="Dark mode" />
            <FormControlLabel control={<Switch disabled />} label="Disabled" />
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>Required State</SectionHeader>
        <SectionDescription>Form controls with required indicator (asterisk).</SectionDescription>
        <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
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
        </div>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>Error State</SectionHeader>
        <SectionDescription>Form controls in error state with error messages.</SectionDescription>
        <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
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
        </div>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>Disabled State</SectionHeader>
        <SectionDescription>Form controls in disabled state with muted styling.</SectionDescription>
        <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
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
        </div>
      </section>

      <section>
        <SectionHeader>Label Placement</SectionHeader>
        <SectionDescription>
          FormControlLabel with different label placement options.
        </SectionDescription>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
        </div>
      </section>
    </PageContainer>
  );
}

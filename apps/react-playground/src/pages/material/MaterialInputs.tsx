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

export function MaterialInputs() {
  const [showPassword, setShowPassword] = useState(false);
  const [amount, setAmount] = useState('100');
  const [age, setAge] = useState('');

  return (
    <PageContainer>
      <PageTitle>Inputs</PageTitle>
      <PageDescription>
        Material UI input components (InputLabel, InputAdornment, OutlinedInput) with Apollo theme
        overrides. These components work together to create accessible and styled input fields.
      </PageDescription>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>Basic Outlined Inputs</SectionHeader>
        <SectionDescription>
          Standard outlined inputs with labels using OutlinedInput and InputLabel.
        </SectionDescription>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <FormControl variant="outlined" sx={{ minWidth: 300 }}>
            <InputLabel htmlFor="name-input">Full Name</InputLabel>
            <OutlinedInput id="name-input" label="Full Name" />
          </FormControl>
          <FormControl variant="outlined" sx={{ minWidth: 300 }}>
            <InputLabel htmlFor="email-input">Email Address</InputLabel>
            <OutlinedInput id="email-input" type="email" label="Email Address" />
          </FormControl>
        </div>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>With Adornments</SectionHeader>
        <SectionDescription>
          Input fields with icons or text positioned at the start or end using InputAdornment.
        </SectionDescription>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <TextField
            label="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            sx={{ minWidth: 300 }}
          />
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
              startAdornment: <InputAdornment position="start">🔍</InputAdornment>,
            }}
            sx={{ minWidth: 300 }}
          />
        </div>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>Interactive Adornment</SectionHeader>
        <SectionDescription>
          Adornments with interactive elements like password visibility toggle.
        </SectionDescription>
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
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </IconButton>
              </InputAdornment>
            }
          />
        </FormControl>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>Standard (Underlined) Inputs</SectionHeader>
        <SectionDescription>Alternative input variant with bottom border only.</SectionDescription>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
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
        </div>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>With Select</SectionHeader>
        <SectionDescription>InputLabel providing context for Select components.</SectionDescription>
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
      </section>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>Multiline</SectionHeader>
        <SectionDescription>
          Outlined input with multiline support for longer text content.
        </SectionDescription>
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
      </section>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>Sizes</SectionHeader>
        <SectionDescription>Input fields in different sizes (small and medium).</SectionDescription>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 300 }}>
            <InputLabel htmlFor="small-input">Small</InputLabel>
            <OutlinedInput id="small-input" label="Small" />
          </FormControl>
          <FormControl variant="outlined" sx={{ minWidth: 300 }}>
            <InputLabel htmlFor="medium-input">Medium (default)</InputLabel>
            <OutlinedInput id="medium-input" label="Medium (default)" />
          </FormControl>
        </div>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>Required State</SectionHeader>
        <SectionDescription>Input fields with required indicator (asterisk).</SectionDescription>
        <FormControl variant="outlined" required sx={{ minWidth: 300 }}>
          <InputLabel htmlFor="required-input">Username</InputLabel>
          <OutlinedInput id="required-input" label="Username" />
        </FormControl>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>Error State</SectionHeader>
        <SectionDescription>Input fields in error state with error messages.</SectionDescription>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
        </div>
      </section>

      <section>
        <SectionHeader>Disabled State</SectionHeader>
        <SectionDescription>Input fields in disabled state with muted styling.</SectionDescription>
        <FormControl variant="outlined" disabled sx={{ minWidth: 300 }}>
          <InputLabel htmlFor="disabled-input">Account Status</InputLabel>
          <OutlinedInput id="disabled-input" label="Account Status" defaultValue="Verified" />
        </FormControl>
      </section>
    </PageContainer>
  );
}

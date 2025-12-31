import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { useState } from 'react';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SectionDescription,
  SectionHeader,
} from '../../components/SharedStyles';
import { CheckboxGrid, VariantSection } from './MaterialCheckbox.styles';

export function MaterialCheckbox() {
  const [checked, setChecked] = useState(true);

  return (
    <PageContainer>
      <PageTitle>Checkbox</PageTitle>
      <PageDescription>
        Material UI Checkbox component with Apollo theme overrides. Features custom colors, focus
        states, and check icon styling.
      </PageDescription>

      <VariantSection>
        <SectionHeader>Basic Checkboxes</SectionHeader>
        <SectionDescription>Standard checkboxes with Apollo theme styling.</SectionDescription>
        <CheckboxGrid>
          <Checkbox defaultChecked />
          <Checkbox />
          <Checkbox disabled />
          <Checkbox disabled checked />
        </CheckboxGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Controlled Checkbox</SectionHeader>
        <SectionDescription>Checkbox with controlled state management.</SectionDescription>
        <CheckboxGrid>
          <Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        </CheckboxGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Color Variants</SectionHeader>
        <SectionDescription>Checkboxes with different color props.</SectionDescription>
        <CheckboxGrid>
          <Checkbox defaultChecked color="primary" />
          <Checkbox defaultChecked color="secondary" />
          <Checkbox defaultChecked color="default" />
        </CheckboxGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Size Variants</SectionHeader>
        <SectionDescription>Checkboxes in different sizes (small, medium).</SectionDescription>
        <CheckboxGrid>
          <Checkbox defaultChecked size="small" />
          <Checkbox defaultChecked size="medium" />
        </CheckboxGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>With Labels</SectionHeader>
        <SectionDescription>
          Checkboxes with FormControlLabel for better accessibility.
        </SectionDescription>
        <FormGroup>
          <FormControlLabel
            control={<Checkbox defaultChecked />}
            label="Accept terms and conditions"
          />
          <FormControlLabel control={<Checkbox />} label="Subscribe to newsletter" />
          <FormControlLabel control={<Checkbox disabled />} label="Disabled option" />
          <FormControlLabel
            control={<Checkbox disabled checked />}
            label="Disabled checked option"
          />
        </FormGroup>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Indeterminate State</SectionHeader>
        <SectionDescription>
          Checkbox in indeterminate state, useful for "select all" scenarios.
        </SectionDescription>
        <CheckboxGrid>
          <Checkbox indeterminate />
          <FormControlLabel
            control={<Checkbox indeterminate />}
            label="Select all (some selected)"
          />
        </CheckboxGrid>
      </VariantSection>
    </PageContainer>
  );
}

import { FormControlLabel, Radio, RadioGroup } from '@mui/material';
import { useState } from 'react';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SectionDescription,
  SectionHeader,
} from '../../components/SharedStyles';
import { RadioGrid, VariantSection } from './MaterialRadio.styles';

export function MaterialRadio() {
  const [value, setValue] = useState('option1');

  return (
    <PageContainer>
      <PageTitle>Radio</PageTitle>
      <PageDescription>
        Material UI Radio component with Apollo theme overrides. Features custom colors, focus
        states, and selection indicators.
      </PageDescription>

      <VariantSection>
        <SectionHeader>Basic Radios</SectionHeader>
        <SectionDescription>Standard radio buttons with Apollo theme styling.</SectionDescription>
        <RadioGrid>
          <Radio defaultChecked />
          <Radio />
          <Radio disabled />
          <Radio disabled checked />
        </RadioGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Color Variants</SectionHeader>
        <SectionDescription>Radio buttons with different color props.</SectionDescription>
        <RadioGrid>
          <Radio defaultChecked color="primary" />
          <Radio defaultChecked color="secondary" />
          <Radio defaultChecked color="default" />
        </RadioGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Size Variants</SectionHeader>
        <SectionDescription>Radio buttons in different sizes (small, medium).</SectionDescription>
        <RadioGrid>
          <Radio defaultChecked size="small" />
          <Radio defaultChecked size="medium" />
        </RadioGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Radio Group</SectionHeader>
        <SectionDescription>
          Radio buttons grouped together with controlled state.
        </SectionDescription>
        <RadioGroup value={value} onChange={(e) => setValue(e.target.value)}>
          <FormControlLabel value="option1" control={<Radio />} label="Option 1" />
          <FormControlLabel value="option2" control={<Radio />} label="Option 2" />
          <FormControlLabel value="option3" control={<Radio />} label="Option 3" />
          <FormControlLabel value="option4" control={<Radio />} label="Disabled option" disabled />
        </RadioGroup>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Horizontal Radio Group</SectionHeader>
        <SectionDescription>Radio buttons arranged horizontally.</SectionDescription>
        <RadioGroup row value={value} onChange={(e) => setValue(e.target.value)}>
          <FormControlLabel value="small" control={<Radio />} label="Small" />
          <FormControlLabel value="medium" control={<Radio />} label="Medium" />
          <FormControlLabel value="large" control={<Radio />} label="Large" />
        </RadioGroup>
      </VariantSection>
    </PageContainer>
  );
}

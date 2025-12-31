import { FormControlLabel, Switch } from '@mui/material';
import { useState } from 'react';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SectionDescription,
  SectionHeader,
} from '../../components/SharedStyles';
import { SwitchGrid, VariantSection } from './MaterialSwitch.styles';

export function MaterialSwitch() {
  const [checked, setChecked] = useState(true);

  return (
    <PageContainer>
      <PageTitle>Switch</PageTitle>
      <PageDescription>
        Material UI Switch component with Apollo theme overrides. Features custom colors, focus
        states, and toggle animations.
      </PageDescription>

      <VariantSection>
        <SectionHeader>Basic Switches</SectionHeader>
        <SectionDescription>Standard toggle switches with Apollo theme styling.</SectionDescription>
        <SwitchGrid>
          <Switch defaultChecked />
          <Switch />
          <Switch disabled />
          <Switch disabled checked />
        </SwitchGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Controlled Switch</SectionHeader>
        <SectionDescription>Switch with controlled state management.</SectionDescription>
        <SwitchGrid>
          <Switch checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        </SwitchGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>With Labels</SectionHeader>
        <SectionDescription>
          Switches with FormControlLabel for better accessibility.
        </SectionDescription>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <FormControlLabel control={<Switch defaultChecked />} label="Enable notifications" />
          <FormControlLabel control={<Switch />} label="Enable dark mode" />
          <FormControlLabel control={<Switch disabled />} label="Disabled option" />
          <FormControlLabel control={<Switch disabled checked />} label="Disabled checked option" />
        </div>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Label Placement</SectionHeader>
        <SectionDescription>Switches with different label placements.</SectionDescription>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Label on the right"
            labelPlacement="end"
          />
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Label on the left"
            labelPlacement="start"
          />
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Label on top"
            labelPlacement="top"
          />
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Label on bottom"
            labelPlacement="bottom"
          />
        </div>
      </VariantSection>
    </PageContainer>
  );
}

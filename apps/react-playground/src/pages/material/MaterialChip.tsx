import { Chip } from '@mui/material';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SectionDescription,
  SectionHeader,
} from '../../components/SharedStyles';
import { ChipGrid, VariantSection } from './MaterialChip.styles';

export function MaterialChip() {
  return (
    <PageContainer>
      <PageTitle>Chip</PageTitle>
      <PageDescription>
        Material UI Chip component with Apollo theme overrides. Features custom colors, icons, and
        interactive states.
      </PageDescription>

      <VariantSection>
        <SectionHeader>Basic Chips</SectionHeader>
        <SectionDescription>Standard chips with Apollo theme styling.</SectionDescription>
        <ChipGrid>
          <Chip label="Default" />
          <Chip label="Clickable" onClick={() => alert('Clicked!')} />
          <Chip label="Deletable" onDelete={() => alert('Deleted!')} />
          <Chip label="Disabled" disabled />
        </ChipGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Color Variants</SectionHeader>
        <SectionDescription>Chips with different color props.</SectionDescription>
        <ChipGrid>
          <Chip label="Primary" color="primary" />
          <Chip label="Secondary" color="secondary" />
          <Chip label="Success" color="success" />
          <Chip label="Error" color="error" />
          <Chip label="Warning" color="warning" />
          <Chip label="Info" color="info" />
        </ChipGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Outlined Variant</SectionHeader>
        <SectionDescription>
          Chips with outlined style instead of filled background.
        </SectionDescription>
        <ChipGrid>
          <Chip label="Default" variant="outlined" />
          <Chip label="Primary" variant="outlined" color="primary" />
          <Chip label="Secondary" variant="outlined" color="secondary" />
          <Chip label="Deletable" variant="outlined" onDelete={() => alert('Deleted!')} />
        </ChipGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Size Variants</SectionHeader>
        <SectionDescription>Chips in different sizes (small, medium).</SectionDescription>
        <ChipGrid>
          <Chip label="Small" size="small" />
          <Chip label="Medium" size="medium" />
          <Chip label="Small Outlined" size="small" variant="outlined" />
          <Chip label="Medium Outlined" size="medium" variant="outlined" />
        </ChipGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>With Icons</SectionHeader>
        <SectionDescription>Chips with custom icons.</SectionDescription>
        <ChipGrid>
          <Chip icon={<span>🏠</span>} label="Home" />
          <Chip icon={<span>⭐</span>} label="Favorite" />
          <Chip icon={<span>✉️</span>} label="Email" onDelete={() => alert('Deleted!')} />
          <Chip icon={<span>👤</span>} label="User" onClick={() => alert('Clicked!')} />
        </ChipGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Clickable with Delete</SectionHeader>
        <SectionDescription>Chips that are both clickable and deletable.</SectionDescription>
        <ChipGrid>
          <Chip
            label="React"
            onClick={() => alert('Clicked React!')}
            onDelete={() => alert('Deleted React!')}
          />
          <Chip
            label="TypeScript"
            color="primary"
            onClick={() => alert('Clicked TypeScript!')}
            onDelete={() => alert('Deleted TypeScript!')}
          />
          <Chip
            label="Apollo"
            color="secondary"
            variant="outlined"
            onClick={() => alert('Clicked Apollo!')}
            onDelete={() => alert('Deleted Apollo!')}
          />
        </ChipGrid>
      </VariantSection>
    </PageContainer>
  );
}

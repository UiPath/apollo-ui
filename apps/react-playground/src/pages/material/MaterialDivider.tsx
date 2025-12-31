import { Divider } from '@mui/material';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SectionDescription,
  SectionHeader,
} from '../../components/SharedStyles';
import { DividerContainer, VariantSection } from './MaterialDivider.styles';

export function MaterialDivider() {
  return (
    <PageContainer>
      <PageTitle>Divider</PageTitle>
      <PageDescription>
        Material UI Divider component with Apollo theme overrides. Provides horizontal and vertical
        dividers for content separation.
      </PageDescription>

      <VariantSection>
        <SectionHeader>Horizontal Divider</SectionHeader>
        <SectionDescription>
          Standard horizontal divider with Apollo theme styling.
        </SectionDescription>
        <DividerContainer>
          <Divider />
        </DividerContainer>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Vertical Divider</SectionHeader>
        <SectionDescription>Vertical dividers for separating inline content.</SectionDescription>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Item 1</span>
          <Divider orientation="vertical" flexItem />
          <span>Item 2</span>
          <Divider orientation="vertical" flexItem />
          <span>Item 3</span>
        </div>
      </VariantSection>
    </PageContainer>
  );
}

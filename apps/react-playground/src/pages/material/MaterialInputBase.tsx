import { InputAdornment, InputBase } from '@mui/material';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SectionDescription,
  SectionHeader,
} from '../../components/SharedStyles';
import { FormGrid, VariantSection } from './MaterialInputBase.styles';

export function MaterialInputBase() {
  return (
    <PageContainer>
      <PageTitle>Input Base</PageTitle>
      <PageDescription>
        Material UI InputBase component with Apollo theme overrides. A foundational unstyled input
        component used as the base for other input variants. Note: InputBase is intentionally
        minimal and requires custom styling for production use.
      </PageDescription>

      <VariantSection>
        <SectionHeader>Basic InputBase</SectionHeader>
        <SectionDescription>
          Unstyled input component demonstrating the minimal primitive nature of InputBase.
        </SectionDescription>
        <FormGrid>
          <InputBase placeholder="Enter your name" sx={{ minWidth: 300 }} />
          <InputBase placeholder="Email address" type="email" sx={{ minWidth: 300 }} />
        </FormGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>With Adornments</SectionHeader>
        <SectionDescription>InputBase with start and end adornments.</SectionDescription>
        <FormGrid>
          <InputBase
            placeholder="Search..."
            startAdornment={<InputAdornment position="start">🔍</InputAdornment>}
            sx={{ minWidth: 300 }}
          />
          <InputBase
            placeholder="Amount"
            startAdornment={<InputAdornment position="start">$</InputAdornment>}
            endAdornment={<InputAdornment position="end">.00</InputAdornment>}
            sx={{ minWidth: 300 }}
          />
        </FormGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Multiline</SectionHeader>
        <SectionDescription>InputBase with multiline support (textarea).</SectionDescription>
        <FormGrid>
          <InputBase
            placeholder="Enter your message..."
            multiline
            rows={4}
            sx={{ minWidth: 300 }}
          />
        </FormGrid>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Disabled State</SectionHeader>
        <SectionDescription>InputBase in disabled state.</SectionDescription>
        <FormGrid>
          <InputBase
            placeholder="Disabled input"
            disabled
            defaultValue="Cannot edit"
            sx={{ minWidth: 300 }}
          />
        </FormGrid>
      </VariantSection>
    </PageContainer>
  );
}

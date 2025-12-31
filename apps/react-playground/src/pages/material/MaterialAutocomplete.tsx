import { Autocomplete, TextField } from '@mui/material';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SectionDescription,
  SectionHeader,
} from '../../components/SharedStyles';

const options = ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5'];

export function MaterialAutocomplete() {
  return (
    <PageContainer>
      <PageTitle>Autocomplete</PageTitle>
      <PageDescription>
        Material UI Autocomplete component with Apollo theme overrides. Features custom dropdown
        styling, chip rendering, and search functionality.
      </PageDescription>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>Basic Autocomplete</SectionHeader>
        <SectionDescription>Standard autocomplete with Apollo theme styling.</SectionDescription>
        <Autocomplete
          options={options}
          sx={{ maxWidth: 400 }}
          renderInput={(params) => <TextField {...params} label="Select option" />}
        />
      </section>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>Multiple Selection</SectionHeader>
        <SectionDescription>Autocomplete allowing multiple selections.</SectionDescription>
        <Autocomplete
          multiple
          options={options}
          sx={{ maxWidth: 400 }}
          renderInput={(params) => <TextField {...params} label="Select multiple" />}
        />
      </section>
    </PageContainer>
  );
}

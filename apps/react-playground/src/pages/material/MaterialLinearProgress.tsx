import { LinearProgress } from '@mui/material';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SectionDescription,
  SectionHeader,
} from '../../components/SharedStyles';
import { ProgressContainer, VariantSection } from './MaterialLinearProgress.styles';

export function MaterialLinearProgress() {
  return (
    <PageContainer>
      <PageTitle>Linear Progress</PageTitle>
      <PageDescription>
        Material UI LinearProgress component with Apollo theme overrides. Features custom colors and
        variants for progress bars.
      </PageDescription>

      <VariantSection>
        <SectionHeader>Indeterminate Progress</SectionHeader>
        <SectionDescription>Standard linear progress bar (indeterminate).</SectionDescription>
        <ProgressContainer>
          <LinearProgress />
        </ProgressContainer>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Color Variants</SectionHeader>
        <SectionDescription>Linear progress with different color props.</SectionDescription>
        <ProgressContainer>
          <LinearProgress color="primary" />
          <LinearProgress color="secondary" />
          <LinearProgress color="success" />
          <LinearProgress color="error" />
          <LinearProgress color="warning" />
          <LinearProgress color="info" />
        </ProgressContainer>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Determinate Progress</SectionHeader>
        <SectionDescription>Linear progress with specific values (determinate).</SectionDescription>
        <ProgressContainer>
          <LinearProgress variant="determinate" value={25} />
          <LinearProgress variant="determinate" value={50} />
          <LinearProgress variant="determinate" value={75} />
          <LinearProgress variant="determinate" value={100} />
        </ProgressContainer>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Buffer Variant</SectionHeader>
        <SectionDescription>
          Linear progress with buffer showing download progress.
        </SectionDescription>
        <ProgressContainer>
          <LinearProgress variant="buffer" value={60} valueBuffer={80} />
        </ProgressContainer>
      </VariantSection>
    </PageContainer>
  );
}

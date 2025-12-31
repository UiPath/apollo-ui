import { Typography } from '@mui/material';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SectionDescription,
  SectionHeader,
} from '../../components/SharedStyles';
import { TypographyStack, VariantSection } from './MaterialTypography.styles';

export function MaterialTypography() {
  return (
    <PageContainer>
      <PageTitle>Typography</PageTitle>
      <PageDescription>
        Material UI Typography component with Apollo theme overrides. Features custom font families,
        sizes, weights, and text styles.
      </PageDescription>

      <VariantSection>
        <SectionHeader>Heading Variants</SectionHeader>
        <SectionDescription>Typography variants for headings (h1 through h6).</SectionDescription>
        <TypographyStack>
          <Typography variant="h1">Heading 1</Typography>
          <Typography variant="h2">Heading 2</Typography>
          <Typography variant="h3">Heading 3</Typography>
          <Typography variant="h4">Heading 4</Typography>
          <Typography variant="h5">Heading 5</Typography>
          <Typography variant="h6">Heading 6</Typography>
        </TypographyStack>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Body Text Variants</SectionHeader>
        <SectionDescription>Typography variants for body text.</SectionDescription>
        <TypographyStack>
          <Typography variant="body1">
            Body 1: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua.
          </Typography>
          <Typography variant="body2">
            Body 2: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua.
          </Typography>
        </TypographyStack>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Special Variants</SectionHeader>
        <SectionDescription>
          Typography variants for captions, overlines, and subtitles.
        </SectionDescription>
        <TypographyStack>
          <Typography variant="subtitle1">Subtitle 1</Typography>
          <Typography variant="subtitle2">Subtitle 2</Typography>
          <Typography variant="caption">Caption text</Typography>
          <Typography variant="overline">Overline text</Typography>
          <Typography variant="button">Button text</Typography>
        </TypographyStack>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Color Variants</SectionHeader>
        <SectionDescription>Typography with different color props.</SectionDescription>
        <TypographyStack>
          <Typography color="primary">Primary color text</Typography>
          <Typography color="secondary">Secondary color text</Typography>
          <Typography color="text.primary">Text primary color</Typography>
          <Typography color="text.secondary">Text secondary color</Typography>
          <Typography color="text.disabled">Text disabled color</Typography>
          <Typography color="error">Error color text</Typography>
          <Typography color="warning">Warning color text</Typography>
          <Typography color="info">Info color text</Typography>
          <Typography color="success">Success color text</Typography>
        </TypographyStack>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Text Alignment</SectionHeader>
        <SectionDescription>Typography with different text alignments.</SectionDescription>
        <TypographyStack>
          <Typography align="left">Left aligned text</Typography>
          <Typography align="center">Center aligned text</Typography>
          <Typography align="right">Right aligned text</Typography>
          <Typography align="justify">
            Justified text: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
            tempor incididunt ut labore et dolore magna aliqua.
          </Typography>
        </TypographyStack>
      </VariantSection>

      <VariantSection>
        <SectionHeader>Text Transformation</SectionHeader>
        <SectionDescription>
          Typography with gutterBottom spacing and noWrap overflow handling.
        </SectionDescription>
        <TypographyStack>
          <Typography gutterBottom>Text with gutter bottom margin</Typography>
          <Typography paragraph>
            Paragraph text: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
            tempor incididunt ut labore et dolore magna aliqua.
          </Typography>
          <Typography noWrap sx={{ maxWidth: 300 }}>
            Text that will not wrap and will be truncated with ellipsis when it's too long for the
            container
          </Typography>
        </TypographyStack>
      </VariantSection>
    </PageContainer>
  );
}

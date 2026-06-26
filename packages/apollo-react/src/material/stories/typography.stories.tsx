import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { FontVariantToken, Typography as TypographyTokens } from '../../core';
import { ApTypography } from '../components';
import { ConsumptionTabs, materialParameters, Section } from './storybook-helpers';

/**
 * Typography exists on two consumption paths:
 * - `Typography` from `@mui/material` — variants mapped by the Apollo theme
 *   overrides (h1–h6, body, subtitle, caption, overline, button).
 * - `ApTypography` from `@uipath/apollo-react/material/components` — driven by
 *   `FontVariantToken` Apollo design tokens (hero, heading, body, brand, mono).
 */
const meta: Meta = {
  title: 'Components/Typography',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const MUI_IMPORT = "import { Typography } from '@mui/material';";
const AP_IMPORT =
  "import { ApTypography } from '@uipath/apollo-react/material/components';\nimport { FontVariantToken } from '@uipath/apollo-react/core';";

type FontVariantName = keyof typeof FontVariantToken;

const typographySpecs = TypographyTokens as Record<
  string,
  { fontSize?: string; fontWeight?: string | number } | undefined
>;

function VariantItem({
  name,
  color,
  children,
}: {
  name: FontVariantName;
  color?: string;
  children: ReactNode;
}) {
  const spec = typographySpecs[name];
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        p: 2,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'monospace',
          fontSize: 12,
          color: 'text.secondary',
        }}
      >
        <span>{name}</span>
        {spec && (
          <Box component="span" sx={{ fontSize: 11, opacity: 0.7 }}>
            {`${spec.fontSize} / ${spec.fontWeight}`}
          </Box>
        )}
      </Box>
      <ApTypography variant={FontVariantToken[name]} color={color}>
        {children}
      </ApTypography>
    </Box>
  );
}

const HEADING_SAMPLE = 'The quick brown fox jumps over the lazy dog';
const BODY_SAMPLE = 'The quick brown fox jumps over the lazy dog. This is a sample paragraph.';

const HERO_VARIANTS: FontVariantName[] = ['fontSizeHeroBold', 'fontSizeHero'];
const HEADING_VARIANTS: FontVariantName[] = [
  'fontSizeH1Bold',
  'fontSizeH1',
  'fontSizeH2Bold',
  'fontSizeH2',
  'fontSizeH3Bold',
  'fontSizeH3',
  'fontSizeH4Bold',
  'fontSizeH4',
];
const BODY_VARIANTS: FontVariantName[] = [
  'fontSizeLBold',
  'fontSizeL',
  'fontSizeMBold',
  'fontSizeM',
  'fontSizeLink',
  'fontSizeSBold',
  'fontSizeS',
  'fontSizeXsBold',
  'fontSizeXs',
];
const BRAND_VARIANTS: FontVariantName[] = ['fontBrandH4', 'fontBrandL', 'fontBrandM'];
const MONO_VARIANTS: FontVariantName[] = [
  'fontMonoMBold',
  'fontMonoM',
  'fontMonoSBold',
  'fontMonoS',
  'fontMonoXSBold',
  'fontMonoXS',
];

export const Headings: Story = {
  render: () => (
    <ConsumptionTabs
      muiImport={MUI_IMPORT}
      apImport={AP_IMPORT}
      mui={
        <Stack spacing={2}>
          <Typography variant="h1">Heading 1</Typography>
          <Typography variant="h2">Heading 2</Typography>
          <Typography variant="h3">Heading 3</Typography>
          <Typography variant="h4">Heading 4</Typography>
          <Typography variant="h5">Heading 5</Typography>
          <Typography variant="h6">Heading 6</Typography>
        </Stack>
      }
      ap={
        <Stack spacing={2}>
          {HERO_VARIANTS.map((name) => (
            <VariantItem key={name} name={name}>
              The quick brown fox
            </VariantItem>
          ))}
          {HEADING_VARIANTS.map((name) => (
            <VariantItem key={name} name={name}>
              {HEADING_SAMPLE}
            </VariantItem>
          ))}
        </Stack>
      }
    />
  ),
};

export const BodyText: Story = {
  render: () => (
    <ConsumptionTabs
      muiImport={MUI_IMPORT}
      apImport={AP_IMPORT}
      mui={
        <>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Body text variants
          </Typography>
          <Stack spacing={2} sx={{ mb: 4 }}>
            <Typography variant="body1">
              Body 1: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua.
            </Typography>
            <Typography variant="body2">
              Body 2: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua.
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Special variants (captions, overlines, subtitles)
          </Typography>
          <Stack spacing={2}>
            <Typography variant="subtitle1">Subtitle 1</Typography>
            <Typography variant="subtitle2">Subtitle 2</Typography>
            <Typography variant="caption">Caption text</Typography>
            <Typography variant="overline">Overline text</Typography>
            <Typography variant="button">Button text</Typography>
          </Stack>
        </>
      }
      ap={
        <Stack spacing={2}>
          {BODY_VARIANTS.map((name) => (
            <VariantItem key={name} name={name}>
              {name === 'fontSizeLink' ? HEADING_SAMPLE : BODY_SAMPLE}
            </VariantItem>
          ))}
        </Stack>
      }
    />
  ),
};

export const BrandAndMonospace: Story = {
  render: () => (
    <>
      <Section
        title="Brand Variants"
        description="ApTypography brand variants rendered with the primary palette color."
      >
        <Stack spacing={2}>
          {BRAND_VARIANTS.map((name) => (
            <VariantItem key={name} name={name} color="primary">
              {HEADING_SAMPLE}
            </VariantItem>
          ))}
        </Stack>
      </Section>
      <Section title="Monospace Variants" description="ApTypography monospace variants.">
        <Stack spacing={2}>
          {MONO_VARIANTS.map((name) => (
            <VariantItem key={name} name={name}>
              {HEADING_SAMPLE}
            </VariantItem>
          ))}
        </Stack>
      </Section>
    </>
  ),
};

export const ColorsAndAlignment: Story = {
  render: () => (
    <>
      <Section title="Color Variants" description="Typography with different color props.">
        <Stack spacing={1}>
          <Typography color="primary">Primary color text</Typography>
          <Typography color="secondary">Secondary color text</Typography>
          <Typography color="text.primary">Text primary color</Typography>
          <Typography color="text.secondary">Text secondary color</Typography>
          <Typography color="text.disabled">Text disabled color</Typography>
          <Typography color="error">Error color text</Typography>
          <Typography color="warning">Warning color text</Typography>
          <Typography color="info">Info color text</Typography>
          <Typography color="success">Success color text</Typography>
        </Stack>
      </Section>
      <Section title="Text Alignment" description="Typography with different text alignments.">
        <Stack spacing={1}>
          <Typography align="left">Left aligned text</Typography>
          <Typography align="center">Center aligned text</Typography>
          <Typography align="right">Right aligned text</Typography>
          <Typography align="justify">
            Justified text: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
            tempor incididunt ut labore et dolore magna aliqua.
          </Typography>
        </Stack>
      </Section>
    </>
  ),
};

export const TextBehavior: Story = {
  render: () => (
    <Section
      title="Text Behavior"
      description="Typography with gutterBottom spacing, paragraph margins and noWrap overflow handling."
    >
      <Stack spacing={1}>
        <Typography gutterBottom>Text with gutter bottom margin</Typography>
        <Typography paragraph>
          Paragraph text: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
          tempor incididunt ut labore et dolore magna aliqua.
        </Typography>
        <Typography noWrap sx={{ maxWidth: 300 }}>
          Text that will not wrap and will be truncated with ellipsis when it's too long for the
          container
        </Typography>
      </Stack>
    </Section>
  ),
};

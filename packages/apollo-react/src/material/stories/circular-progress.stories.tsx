import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react';
import { ApCircularProgress } from '../components';
import { ConsumptionTabs, materialParameters, Row, Section } from './storybook-helpers';

/**
 * Circular progress indicators exist on two consumption paths:
 * - `CircularProgress` from `@mui/material` — styled by the Apollo theme
 *   overrides, with `color`, `size` and determinate/indeterminate variants.
 * - `ApCircularProgress` from `@uipath/apollo-react/material/components` —
 *   the Apollo spinner with a pixel `size` and any CSS `color` value.
 */
const meta: Meta = {
  title: 'Components/Circular Progress',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const MUI_IMPORT = "import { CircularProgress } from '@mui/material';";
const AP_IMPORT = "import { ApCircularProgress } from '@uipath/apollo-react/material/components';";

const AP_SIZES = [16, 24, 32, 48, 64, 96] as const;

function LabeledItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack spacing={1} sx={{ alignItems: 'center' }}>
      {children}
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
        {label}
      </Typography>
    </Stack>
  );
}

export const Basic: Story = {
  render: () => (
    <ConsumptionTabs
      muiImport={MUI_IMPORT}
      apImport={AP_IMPORT}
      mui={
        <Row label="Standard indeterminate progress indicator">
          <CircularProgress />
        </Row>
      }
      ap={
        <Row label="Default (primary color)">
          <ApCircularProgress />
        </Row>
      }
    />
  ),
};

export const Colors: Story = {
  render: () => (
    <ConsumptionTabs
      muiImport={MUI_IMPORT}
      apImport={AP_IMPORT}
      mui={
        <Row label="MUI color props">
          <CircularProgress color="primary" />
          <CircularProgress color="secondary" />
          <CircularProgress color="success" />
          <CircularProgress color="error" />
          <CircularProgress color="warning" />
          <CircularProgress color="info" />
        </Row>
      }
      ap={
        <Row label="Any CSS color value">
          <LabeledItem label="Primary">
            <ApCircularProgress color="var(--color-primary)" />
          </LabeledItem>
          <LabeledItem label="Brand Orange">
            <ApCircularProgress color="#fa4616" />
          </LabeledItem>
          <LabeledItem label="Purple">
            <ApCircularProgress color="#764ba2" />
          </LabeledItem>
          <LabeledItem label="Green">
            <ApCircularProgress color="#00ff00" />
          </LabeledItem>
        </Row>
      }
    />
  ),
};

export const Sizes: Story = {
  render: () => (
    <ConsumptionTabs
      muiImport={MUI_IMPORT}
      apImport={AP_IMPORT}
      mui={
        <Row label="Pixel sizes">
          <CircularProgress size={20} />
          <CircularProgress size={30} />
          <CircularProgress size={40} />
          <CircularProgress size={60} />
          <CircularProgress size={80} />
        </Row>
      }
      ap={
        <Row label="Pixel sizes">
          {AP_SIZES.map((size) => (
            <LabeledItem key={size} label={`${size}px`}>
              <ApCircularProgress size={size} />
            </LabeledItem>
          ))}
        </Row>
      }
    />
  ),
};

export const DeterminateProgress: Story = {
  render: () => (
    <Section
      title="Determinate Progress"
      description="Circular progress with a specific value — MUI only."
    >
      <Row>
        <CircularProgress variant="determinate" value={25} />
        <CircularProgress variant="determinate" value={50} />
        <CircularProgress variant="determinate" value={75} />
        <CircularProgress variant="determinate" value={100} />
      </Row>
    </Section>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <Section
      title="With Label"
      description="Determinate circular progress with a centered percentage label — MUI only."
    >
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress variant="determinate" value={75} size={80} />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography component="span">75%</Typography>
        </Box>
      </Box>
    </Section>
  ),
};

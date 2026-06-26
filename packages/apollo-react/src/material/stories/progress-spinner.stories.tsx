import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { ApProgressSpinner } from '../components';
import { materialParameters, Row, Section } from './storybook-helpers';

/**
 * `ApProgressSpinner` from `@uipath/apollo-react/material/components`.
 *
 * A loading spinner with predefined sizes and color variants.
 */
const meta: Meta = {
  title: 'Components/Progress Spinner',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const SIZES = [
  { size: 'xs', pixels: '12px' },
  { size: 's', pixels: '16px' },
  { size: 'm', pixels: '24px' },
  { size: 'l', pixels: '32px' },
  { size: 'xl', pixels: '44px' },
  { size: 'xxl', pixels: '72px' },
] as const;

const COLORS = [
  { color: 'primary', label: 'Primary' },
  { color: 'secondary', label: 'Secondary' },
  { color: 'success', label: 'Success' },
  { color: 'error', label: 'Error' },
  { color: 'warning', label: 'Warning' },
  { color: 'info', label: 'Info' },
  { color: 'inherit', label: 'Inherit' },
] as const;

function SpinnerItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        minWidth: 100,
      }}
    >
      {children}
      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
        {label}
      </Typography>
    </Box>
  );
}

export const Default: Story = {
  render: () => (
    <Section title="Default" description="Medium size, primary color.">
      <Row>
        <ApProgressSpinner />
      </Row>
    </Section>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Section title="Sizes" description="All predefined spinner sizes.">
      <Row>
        {SIZES.map(({ size, pixels }) => (
          <SpinnerItem key={size} label={`${size} (${pixels})`}>
            <ApProgressSpinner size={size} />
          </SpinnerItem>
        ))}
      </Row>
    </Section>
  ),
};

export const Colors: Story = {
  render: () => (
    <Section title="Colors" description="All color variants at medium size.">
      <Row>
        {COLORS.map(({ color, label }) => (
          <SpinnerItem key={color} label={label}>
            <ApProgressSpinner size="m" color={color} />
          </SpinnerItem>
        ))}
      </Row>
    </Section>
  ),
};

export const Combinations: Story = {
  render: () => (
    <Section title="All Combinations (Sample)" description="Sample of size and color combinations.">
      <Row>
        <SpinnerItem label="XS Primary">
          <ApProgressSpinner size="xs" color="primary" />
        </SpinnerItem>
        <SpinnerItem label="S Secondary">
          <ApProgressSpinner size="s" color="secondary" />
        </SpinnerItem>
        <SpinnerItem label="M Success">
          <ApProgressSpinner size="m" color="success" />
        </SpinnerItem>
        <SpinnerItem label="L Error">
          <ApProgressSpinner size="l" color="error" />
        </SpinnerItem>
        <SpinnerItem label="XL Warning">
          <ApProgressSpinner size="xl" color="warning" />
        </SpinnerItem>
        <SpinnerItem label="XXL Info">
          <ApProgressSpinner size="xxl" color="info" />
        </SpinnerItem>
      </Row>
    </Section>
  ),
};

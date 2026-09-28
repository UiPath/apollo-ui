import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ApButton, ApSkeleton } from '../components';
import { materialParameters, Section } from './storybook-helpers';

/**
 * `ApSkeleton` from `@uipath/apollo-react/material/components`.
 *
 * Loading placeholders for content while data is being fetched. Each story
 * has a toggle to switch between the skeleton and the loaded content.
 */
const meta: Meta = {
  title: 'Components/Skeleton',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

function useLoadingToggle() {
  const [loading, setLoading] = useState(true);
  const toggle = (
    <Box sx={{ mb: 2 }}>
      <ApButton
        label={loading ? 'Show content' : 'Show skeleton'}
        variant="secondary"
        widthMode="fit-content"
        onClick={() => setLoading(!loading)}
      />
    </Box>
  );
  return { loading, toggle };
}

function RectangleDemo() {
  const { loading, toggle } = useLoadingToggle();
  return (
    <Section title="Rectangle" description="Text-line placeholders with decreasing widths.">
      {toggle}
      {loading ? (
        <Stack spacing={2}>
          <ApSkeleton variant="rectangle" style={{ width: '100%' }} />
          <ApSkeleton variant="rectangle" style={{ width: '80%' }} />
          <ApSkeleton variant="rectangle" style={{ width: '60%' }} />
        </Stack>
      ) : (
        <Box>
          <Typography variant="body2">This is the actual content that would be loaded.</Typography>
          <Typography variant="body2">
            The skeleton provides a placeholder during loading.
          </Typography>
          <Typography variant="body2">It helps improve perceived performance.</Typography>
        </Box>
      )}
    </Section>
  );
}

function CircleDemo() {
  const { loading, toggle } = useLoadingToggle();
  return (
    <Section title="Circle" description="Circular placeholder, e.g. for an avatar.">
      {toggle}
      {loading ? (
        <ApSkeleton variant="circle" circleSize={80} />
      ) : (
        <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'primary.main' }} />
      )}
    </Section>
  );
}

function CardDemo() {
  const { loading, toggle } = useLoadingToggle();
  return (
    <Section
      title="Card"
      description="Border variant wrapping nested circle and rectangle skeletons."
    >
      {toggle}
      {loading ? (
        <ApSkeleton
          variant="border"
          style={{ width: '100%', height: 120, padding: 16, boxSizing: 'border-box' }}
        >
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', height: '100%' }}>
            <ApSkeleton variant="circle" circleSize={60} />
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <ApSkeleton variant="rectangle" style={{ width: '80%' }} />
              <ApSkeleton variant="rectangle" style={{ width: '60%' }} />
              <ApSkeleton variant="rectangle" style={{ width: '40%' }} />
            </Box>
          </Box>
        </ApSkeleton>
      ) : (
        <Box
          sx={{
            height: 120,
            p: 2,
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%' }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                flexShrink: 0,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1">John Doe</Typography>
              <Typography variant="body2">Software Engineer</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                San Francisco, CA
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Section>
  );
}

export const Rectangle: Story = {
  render: () => <RectangleDemo />,
};

export const Circle: Story = {
  render: () => <CircleDemo />,
};

export const Card: Story = {
  render: () => <CardDemo />,
};

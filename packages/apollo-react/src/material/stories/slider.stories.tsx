import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { materialParameters, Section } from './storybook-helpers';

/**
 * Material UI Slider with Apollo theme overrides. Features custom track
 * styling, thumb indicators, and value labels. Consumed directly from
 * `@mui/material` — the Apollo theme overrides style it.
 */
const meta: Meta = {
  title: 'Components/Slider',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

function SliderContainer({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ maxWidth: 400, px: 1 }}>
      <Stack spacing={4}>{children}</Stack>
    </Box>
  );
}

function ControlledSliderDemo() {
  const [value, setValue] = useState(30);
  return (
    <Section title="Controlled Slider" description="Slider with controlled state management.">
      <SliderContainer>
        <Box>
          <Slider value={value} onChange={(_, val) => setValue(val as number)} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Value: {value}
          </Typography>
        </Box>
      </SliderContainer>
    </Section>
  );
}

export const Basic: Story = {
  render: () => (
    <>
      <Section title="Basic Slider" description="Standard slider with Apollo theme styling.">
        <SliderContainer>
          <Slider defaultValue={50} />
        </SliderContainer>
      </Section>
      <ControlledSliderDemo />
    </>
  ),
};

export const ValueLabels: Story = {
  render: () => (
    <Section title="With Value Label" description="Slider displaying value label on thumb.">
      <SliderContainer>
        <Slider defaultValue={30} valueLabelDisplay="auto" />
        <Slider defaultValue={50} valueLabelDisplay="on" />
      </SliderContainer>
    </Section>
  ),
};

export const Marks: Story = {
  render: () => (
    <>
      <Section title="Discrete Slider" description="Slider with discrete steps and marks.">
        <SliderContainer>
          <Slider defaultValue={30} step={10} marks min={0} max={100} valueLabelDisplay="auto" />
        </SliderContainer>
      </Section>
      <Section title="Custom Marks" description="Slider with custom labeled marks.">
        <SliderContainer>
          <Slider
            defaultValue={20}
            step={null}
            marks={[
              { value: 0, label: '0°C' },
              { value: 20, label: '20°C' },
              { value: 37, label: '37°C' },
              { value: 100, label: '100°C' },
            ]}
            valueLabelDisplay="auto"
          />
        </SliderContainer>
      </Section>
    </>
  ),
};

function RangeSliderDemo() {
  const [value, setValue] = useState<number[]>([20, 40]);
  return (
    <Section title="Range Slider" description="Slider with two thumbs for selecting a range.">
      <SliderContainer>
        <Box>
          <Slider
            value={value}
            onChange={(_, val) => setValue(val as number[])}
            valueLabelDisplay="auto"
            min={0}
            max={100}
          />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Range: {value[0]} - {value[1]}
          </Typography>
        </Box>
      </SliderContainer>
    </Section>
  );
}

export const Range: Story = {
  render: () => <RangeSliderDemo />,
};

export const Variants: Story = {
  render: () => (
    <>
      <Section title="Color Variants" description="Sliders with different color props.">
        <SliderContainer>
          <Slider defaultValue={30} color="primary" />
          <Slider defaultValue={50} color="secondary" />
        </SliderContainer>
      </Section>
      <Section title="Size Variants" description="Sliders in different sizes (small, medium).">
        <SliderContainer>
          <Slider defaultValue={30} size="small" />
          <Slider defaultValue={50} size="medium" />
        </SliderContainer>
      </Section>
      <Section title="Disabled State" description="Slider in disabled state.">
        <SliderContainer>
          <Slider defaultValue={30} disabled />
        </SliderContainer>
      </Section>
    </>
  ),
};

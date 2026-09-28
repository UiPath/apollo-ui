import Button from '@mui/material/Button';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { materialParameters, Row, Section } from './storybook-helpers';

/**
 * Material UI Stepper with Apollo theme overrides. Features custom styling
 * for step indicators and connectors. Consumed directly from `@mui/material`
 * — the Apollo theme overrides style it.
 */
const meta: Meta = {
  title: 'Components/Stepper',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const STEPS = ['Select campaign settings', 'Create an ad group', 'Create an ad'];

function HorizontalStepperDemo() {
  const [activeStep, setActiveStep] = useState(0);
  return (
    <Section title="Horizontal Stepper" description="Standard stepper with Apollo theme styling.">
      <Stepper activeStep={activeStep} sx={{ maxWidth: 600, mb: 3 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <Row>
        <Button disabled={activeStep === 0} onClick={() => setActiveStep((prev) => prev - 1)}>
          Back
        </Button>
        <Button
          variant="contained"
          disabled={activeStep === STEPS.length - 1}
          onClick={() => setActiveStep((prev) => prev + 1)}
        >
          Next
        </Button>
      </Row>
    </Section>
  );
}

export const Horizontal: Story = {
  render: () => <HorizontalStepperDemo />,
};

import { Button, Step, StepLabel, Stepper } from '@mui/material';
import { useState } from 'react';
import {
  PageContainer,
  PageDescription,
  PageTitle,
  SectionDescription,
  SectionHeader,
} from '../../components/SharedStyles';

export function MaterialStepper() {
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Select campaign settings', 'Create an ad group', 'Create an ad'];

  return (
    <PageContainer>
      <PageTitle>Stepper</PageTitle>
      <PageDescription>
        Material UI Stepper component with Apollo theme overrides. Features custom styling for step
        indicators and connectors.
      </PageDescription>

      <section style={{ marginBottom: '48px' }}>
        <SectionHeader>Horizontal Stepper</SectionHeader>
        <SectionDescription>Standard stepper with Apollo theme styling.</SectionDescription>
        <Stepper activeStep={activeStep} sx={{ maxWidth: 600 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          <Button disabled={activeStep === 0} onClick={() => setActiveStep((prev) => prev - 1)}>
            Back
          </Button>
          <Button
            variant="contained"
            disabled={activeStep === steps.length - 1}
            onClick={() => setActiveStep((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>
      </section>
    </PageContainer>
  );
}

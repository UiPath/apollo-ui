import type { Meta } from '@storybook/react-vite';
import * as React from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Step, Stepper } from './stepper';

const meta = {
  title: 'Design System/Navigation/Stepper',
  component: Stepper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Stepper>;

export default meta;

const steps: Step[] = [
  { title: 'Account', description: 'Create your account' },
  { title: 'Profile', description: 'Set up your profile' },
  { title: 'Preferences', description: 'Configure settings' },
  { title: 'Complete', description: 'Finish setup' },
];

export const Default = {
  args: {},
  render: () => (
    <div className="w-[600px]">
      <Stepper steps={steps} currentStep={1} />
    </div>
  ),
};

export const Completed = {
  args: {},
  render: () => (
    <div className="w-[600px]">
      <Stepper steps={steps} currentStep={4} />
    </div>
  ),
};

export const FirstStep = {
  args: {},
  render: () => (
    <div className="w-[600px]">
      <Stepper steps={steps} currentStep={0} />
    </div>
  ),
};

export const Vertical = {
  args: {},
  render: () => (
    <div className="w-[400px]">
      <Stepper steps={steps} currentStep={1} orientation="vertical" />
    </div>
  ),
};

export const Interactive = {
  args: {},
  render: () => {
    const [currentStep, setCurrentStep] = React.useState(0);

    return (
      <Card className="w-[700px]">
        <CardContent className="p-6">
          <Stepper
            steps={steps}
            currentStep={currentStep}
            clickableSteps
            onStepClick={setCurrentStep}
            className="mb-8"
          />
          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  },
};

export const WithoutDescriptions = {
  args: {},
  render: () => {
    const simpleSteps: Step[] = [
      { title: 'Step 1' },
      { title: 'Step 2' },
      { title: 'Step 3' },
      { title: 'Step 4' },
    ];

    return (
      <div className="w-[600px]">
        <Stepper steps={simpleSteps} currentStep={2} />
      </div>
    );
  },
};

export const ManySteps = {
  args: {},
  render: () => {
    const manySteps: Step[] = [
      { title: 'Start' },
      { title: 'Step 2' },
      { title: 'Step 3' },
      { title: 'Step 4' },
      { title: 'Step 5' },
      { title: 'Step 6' },
      { title: 'Finish' },
    ];

    return (
      <div className="w-full max-w-[800px]">
        <Stepper steps={manySteps} currentStep={3} />
      </div>
    );
  },
};

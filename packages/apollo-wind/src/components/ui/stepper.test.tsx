import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { Stepper, Step } from './stepper';

const mockSteps: Step[] = [
  { title: 'Step 1', description: 'First step' },
  { title: 'Step 2', description: 'Second step' },
  { title: 'Step 3', description: 'Third step' },
];

describe('Stepper', () => {
  // Rendering tests
  describe('rendering', () => {
    it('renders all steps', () => {
      render(<Stepper steps={mockSteps} currentStep={0} />);
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      expect(screen.getByText('Step 3')).toBeInTheDocument();
    });

    it('renders step descriptions', () => {
      render(<Stepper steps={mockSteps} currentStep={0} />);
      expect(screen.getByText('First step')).toBeInTheDocument();
      expect(screen.getByText('Second step')).toBeInTheDocument();
    });

    it('renders step numbers', () => {
      render(<Stepper steps={mockSteps} currentStep={0} />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('renders without descriptions', () => {
      const stepsWithoutDesc: Step[] = [{ title: 'Step 1' }, { title: 'Step 2' }];
      render(<Stepper steps={stepsWithoutDesc} currentStep={0} />);
      expect(screen.getByText('Step 1')).toBeInTheDocument();
    });
  });

  // Accessibility tests
  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Stepper steps={mockSteps} currentStep={0} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with clickable steps', async () => {
      const { container } = render(
        <Stepper steps={mockSteps} currentStep={1} clickableSteps onStepClick={vi.fn()} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations in vertical orientation', async () => {
      const { container } = render(
        <Stepper steps={mockSteps} currentStep={1} orientation="vertical" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // Orientation tests
  describe('orientation', () => {
    it('renders horizontal by default', () => {
      const { container } = render(<Stepper steps={mockSteps} currentStep={0} />);
      expect(container.firstChild).toHaveClass('flex-row');
    });

    it('renders vertical when specified', () => {
      const { container } = render(
        <Stepper steps={mockSteps} currentStep={0} orientation="vertical" />
      );
      expect(container.firstChild).toHaveClass('flex-col');
    });
  });

  // Step state tests
  describe('step states', () => {
    it('shows completed steps with check mark', () => {
      render(<Stepper steps={mockSteps} currentStep={2} />);
      // Step 1 and 2 should be completed (indices 0 and 1)
      expect(screen.queryByText('1')).not.toBeInTheDocument();
      expect(screen.queryByText('2')).not.toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('highlights current step', () => {
      render(<Stepper steps={mockSteps} currentStep={1} />);
      const currentStepTitle = screen.getByText('Step 2');
      expect(currentStepTitle).toHaveClass('text-foreground');
    });
  });

  // Interaction tests
  describe('interactions', () => {
    it('calls onStepClick when clickable step is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Stepper steps={mockSteps} currentStep={1} clickableSteps onStepClick={handleClick} />
      );

      // Click on completed step (step 1)
      const buttons = screen.getAllByRole('button');
      await user.click(buttons[0]);
      expect(handleClick).toHaveBeenCalledWith(0);
    });

    it('does not call onStepClick for future steps', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Stepper steps={mockSteps} currentStep={0} clickableSteps onStepClick={handleClick} />
      );

      // Try to click on future step (step 3)
      const buttons = screen.getAllByRole('button');
      await user.click(buttons[2]);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('disables steps when not clickable', () => {
      render(<Stepper steps={mockSteps} currentStep={0} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  // Ref forwarding tests
  describe('ref forwarding', () => {
    it('forwards ref to the container element', () => {
      const ref = createRef<HTMLDivElement>();
      render(<Stepper ref={ref} steps={mockSteps} currentStep={0} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  // Custom className tests
  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <Stepper steps={mockSteps} currentStep={0} className="custom-stepper" />
      );
      expect(container.firstChild).toHaveClass('custom-stepper');
    });
  });
});

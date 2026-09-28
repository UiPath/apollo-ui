import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApAccordion } from './ApAccordion';
import userEvent from '@testing-library/user-event';

describe('ApAccordion', () => {
  describe('Basic Rendering', () => {
    it('should render the accordion with label', () => {
      render(
        <ApAccordion label="Test Accordion">
          <div>Accordion Content</div>
        </ApAccordion>
      );
      expect(screen.getByText('Test Accordion')).toBeInTheDocument();
    });

    it('should render the accordion expanded by default when defaultExpanded is true', () => {
      render(
        <ApAccordion label="Test Accordion" defaultExpanded>
          <div>Accordion Content</div>
        </ApAccordion>
      );
      expect(screen.getByText('Accordion Content')).toBeVisible();
    });

    it('should render the accordion collapsed by default when defaultExpanded is false', () => {
      render(
        <ApAccordion label="Test Accordion">
          <div>Accordion Content</div>
        </ApAccordion>
      );
      expect(screen.queryByText('Accordion Content')).not.toBeVisible();
    });

    it('should render the start icon when provided', () => {
      const StartIcon = () => <span data-testid="start-icon">S</span>;
      render(
        <ApAccordion label="Test Accordion" startIcon={<StartIcon />}>
          <div>Accordion Content</div>
        </ApAccordion>
      );
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    it('should expand the accordion when clicked', () => {
      render(
        <ApAccordion label="Test Accordion">
          <div>Accordion Content</div>
        </ApAccordion>
      );
      const summary = screen.getByText('Test Accordion');
      fireEvent.click(summary);
      expect(screen.getByText('Accordion Content')).toBeVisible();
    });

    it('should collapse the accordion when clicked again', async () => {
      render(
        <ApAccordion label="Test Accordion">
          <div>Accordion Content</div>
        </ApAccordion>
      );
      const summary = screen.getByText('Test Accordion');
      expect(screen.queryByText('Accordion Content')).not.toBeVisible();
      fireEvent.click(summary);
      expect(screen.getByText('Accordion Content')).toBeVisible();
      fireEvent.click(summary);
      await waitFor(() => {
        expect(screen.queryByText('Accordion Content')).not.toBeVisible();
      });
    });
  });

  describe('Props Functionality', () => {
    it('should set the label color when labelColor is provided', () => {
      const { container } = render(
        <ApAccordion label="Test Accordion" labelColor="red">
          <div>Accordion Content</div>
        </ApAccordion>
      );
      const summary = container.querySelector('.MuiTypography-root') as HTMLElement;
      expect(summary).toHaveStyle('color: red');
    });

    it('should set the label font size when labelFontSize is provided', () => {
      const { container } = render(
        <ApAccordion label="Test Accordion" labelFontSize="20px">
          <div>Accordion Content</div>
        </ApAccordion>
      );
      const summary = container.querySelector('.MuiTypography-root') as HTMLElement;
      expect(summary).toHaveStyle('font-size: 20px');
    });

    it('should set the label font weight when labelFontWeight is provided', () => {
      const { container } = render(
        <ApAccordion label="Test Accordion" labelFontWeight="700">
          <div>Accordion Content</div>
        </ApAccordion>
      );
      const summary = container.querySelector('.MuiTypography-root') as HTMLElement;
      expect(summary).toHaveStyle('font-weight: 700');
    });

    it('should disable the divider when disableDivider is true', () => {
      const { container } = render(
        <ApAccordion label="Test Accordion" disableDivider>
          <div>Accordion Content</div>
        </ApAccordion>
      );
      const divider = container.querySelector('.MuiAccordionSummary-root::before') as HTMLElement;
      expect(divider).not.toBeInTheDocument();
    });

    it('should apply custom sx to summary when summarySx is provided', () => {
      const { container } = render(
        <ApAccordion label="Test Accordion" summarySx={{ backgroundColor: 'lightgray' }}>
          <div>Accordion Content</div>
        </ApAccordion>
      );
      const summary = container.querySelector('.MuiAccordionSummary-root') as HTMLElement;
      expect(summary).toHaveStyle('background-color: lightgray');
    });

    it('should apply custom sx to details when detailsSx is provided', () => {
      const { container } = render(
        <ApAccordion label="Test Accordion" detailsSx={{ backgroundColor: 'lightblue' }}>
          <div>Accordion Content</div>
        </ApAccordion>
      );
      const details = container.querySelector('.MuiAccordionDetails-root') as HTMLElement;
      expect(details).toHaveStyle('background-color: lightblue');
    });

    it('should position the expand icon correctly based on expandIconPosition prop', () => {
      const { container: containerStart } = render(
        <ApAccordion label="Test Accordion" expandIconPosition="start">
          <div>Accordion Content</div>
        </ApAccordion>
      );
      const summaryStart = containerStart.querySelector('.MuiAccordionSummary-root') as HTMLElement;
      expect(summaryStart).toHaveStyle('flex-direction: row-reverse');
    });

    it('should position the expand icon correctly when expandIconPosition is end', () => {
      const { container: containerEnd } = render(
        <ApAccordion label="Test Accordion" expandIconPosition="end">
          <div>Accordion Content</div>
        </ApAccordion>
      );
      const summaryEnd = containerEnd.querySelector('.MuiAccordionSummary-root') as HTMLElement;
      expect(summaryEnd).toHaveStyle('flex-direction: row');
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate ARIA attributes', () => {
      render(
        <ApAccordion label="Test Accordion">
          <div>Accordion Content</div>
        </ApAccordion>
      );
      const summaryButton = screen.getByRole('button');

      expect(summaryButton).toHaveAttribute('aria-expanded');
      expect(summaryButton).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(summaryButton);
      expect(summaryButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should be operable via keyboard - Enter', async () => {
      render(
        <ApAccordion label="Test Accordion">
          <div>Accordion Content</div>
        </ApAccordion>
      );
      const summary = screen.getByRole('button');
      expect(screen.getByText('Accordion Content')).not.toBeVisible();

      const user = userEvent.setup();

      await user.tab();
      expect(summary).toHaveFocus();

      await user.keyboard('{Enter}');
      await waitFor(() => {
        expect(screen.getByText('Accordion Content')).toBeVisible();
      });

      await user.keyboard('{Enter}');
      await waitFor(() => {
        expect(screen.getByText('Accordion Content')).not.toBeVisible();
      });
    });

    it('should be operable via keyboard - Space', async () => {
      render(
        <ApAccordion label="Test Accordion">
          <div>Accordion Content</div>
        </ApAccordion>
      );
      const summary = screen.getByRole('button');
      expect(screen.getByText('Accordion Content')).not.toBeVisible();

      const user = userEvent.setup();

      await user.tab();
      expect(summary).toHaveFocus();

      fireEvent.keyDown(summary, { key: ' ', code: 'Space' });
      fireEvent.keyUp(summary, { key: ' ', code: 'Space' });

      await waitFor(() => {
        expect(screen.getByText('Accordion Content')).toBeVisible();
      });

      fireEvent.keyDown(summary, { key: ' ', code: 'Space' });
      fireEvent.keyUp(summary, { key: ' ', code: 'Space' });
      await waitFor(() => {
        expect(screen.getByText('Accordion Content')).not.toBeVisible();
      });
    });

    it('should have focus visible when focused', async () => {
      render(
        <ApAccordion label="Test Accordion">
          <div>Accordion Content</div>
        </ApAccordion>
      );
      const summary = screen.getByRole('button');
      expect(screen.getByText('Accordion Content')).not.toBeVisible();

      const user = userEvent.setup();

      await user.tab();
      expect(summary).toHaveFocus();
      expect(summary.classList.contains('Mui-focusVisible')).toBe(true);

      await user.click(document.body);
      expect(summary.classList.contains('Mui-focusVisible')).toBe(false);
      expect(summary).not.toHaveFocus();
    });
  });
});

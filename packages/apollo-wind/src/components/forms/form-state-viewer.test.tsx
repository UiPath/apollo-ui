import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { createFormControl, type FieldValues, type UseFormReturn } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { FormStateViewer } from './form-state-viewer';

// ============================================================================
// Test Helpers
// ============================================================================

interface MockFormStateOptions {
  values?: Record<string, unknown>;
  errors?: Record<string, { message?: string }>;
  isValid?: boolean;
  isDirty?: boolean;
  isSubmitting?: boolean;
  isValidating?: boolean;
  isSubmitted?: boolean;
  isSubmitSuccessful?: boolean;
  submitCount?: number;
  dirtyFields?: Record<string, boolean>;
  touchedFields?: Record<string, boolean>;
}

/**
 * Built on a real form control so `useWatch` has something to subscribe to,
 * with only `formState` stubbed to keep the flags deterministic.
 */
function createMockForm(options: MockFormStateOptions = {}): UseFormReturn<FieldValues> {
  const formControl = createFormControl<FieldValues>({ defaultValues: options.values ?? {} });
  return {
    ...formControl,
    formState: {
      isValid: options.isValid ?? true,
      isDirty: options.isDirty ?? false,
      isSubmitting: options.isSubmitting ?? false,
      isValidating: options.isValidating ?? false,
      isSubmitted: options.isSubmitted ?? false,
      isSubmitSuccessful: options.isSubmitSuccessful ?? false,
      submitCount: options.submitCount ?? 0,
      errors: options.errors ?? {},
      dirtyFields: options.dirtyFields ?? {},
      touchedFields: options.touchedFields ?? {},
    },
  } as unknown as UseFormReturn<FieldValues>;
}

function getBadgeByText(text: string): HTMLElement {
  const badge = screen
    .getAllByText(text)
    .map((el) => el.closest('[data-slot="badge"]'))
    .find((el): el is HTMLElement => el !== null);
  if (!badge) throw new Error(`No badge with text "${text}" found`);
  return badge;
}

// ============================================================================
// Tests
// ============================================================================

describe('FormStateViewer', () => {
  describe('rendering', () => {
    it('renders the default title and stat labels', () => {
      render(<FormStateViewer form={createMockForm()} />);

      expect(screen.getByText('Form State')).toBeInTheDocument();
      expect(screen.getByText('Submits')).toBeInTheDocument();
      // "Errors" appears both as a stat label and as the Errors tab trigger.
      expect(screen.getAllByText('Errors').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('Dirty')).toBeInTheDocument();
      expect(screen.getByText('Touched')).toBeInTheDocument();
    });

    it('renders a custom title', () => {
      render(<FormStateViewer form={createMockForm()} title="Live Form State" />);

      expect(screen.getByText('Live Form State')).toBeInTheDocument();
    });

    it('shows current form values as JSON in the values tab', () => {
      render(<FormStateViewer form={createMockForm({ values: { name: 'John Doe' } })} />);

      expect(screen.getByText(/"name": "John Doe"/)).toBeInTheDocument();
    });
  });

  describe('validity badges', () => {
    it('shows the success Badge variant when the form is valid', () => {
      render(<FormStateViewer form={createMockForm({ isValid: true })} />);

      const badge = getBadgeByText('Valid');
      expect(badge).toHaveClass('bg-success-background');
      expect(badge).toHaveClass('text-success');
    });

    it('shows a destructive badge with the error count when invalid', () => {
      render(
        <FormStateViewer
          form={createMockForm({
            isValid: false,
            errors: {
              name: { message: 'Name is required' },
              email: { message: 'Invalid email' },
            },
          })}
        />
      );

      const badge = getBadgeByText('2 Errors');
      expect(badge).toHaveClass('bg-destructive');
    });

    it('shows a dirty badge with the changed-field count when dirty', () => {
      render(
        <FormStateViewer
          form={createMockForm({
            isDirty: true,
            dirtyFields: { name: true, email: true, age: true },
          })}
        />
      );

      expect(getBadgeByText('3 Changed')).toBeInTheDocument();
    });
  });

  describe('errors tab', () => {
    it('lists each field error with its message', async () => {
      const user = userEvent.setup();
      render(
        <FormStateViewer
          form={createMockForm({
            isValid: false,
            errors: {
              name: { message: 'Name is required' },
              email: { message: 'Invalid email' },
            },
          })}
        />
      );

      await user.click(screen.getByRole('tab', { name: /errors/i }));

      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('email')).toBeInTheDocument();
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    it('falls back to a generic message when an error has no message text', async () => {
      const user = userEvent.setup();
      render(<FormStateViewer form={createMockForm({ isValid: false, errors: { name: {} } })} />);

      await user.click(screen.getByRole('tab', { name: /errors/i }));

      expect(screen.getByText('Invalid value')).toBeInTheDocument();
    });

    it('renders the success box with the bg-success-background/25 class when there are no errors', async () => {
      const user = userEvent.setup();
      render(<FormStateViewer form={createMockForm()} />);

      await user.click(screen.getByRole('tab', { name: /errors/i }));

      const message = screen.getByText('No validation errors');
      expect(message.parentElement).toHaveClass('bg-success-background/25');
    });
  });

  describe('state and fields tabs', () => {
    it('shows react-hook-form state flags in the state tab', async () => {
      const user = userEvent.setup();
      render(
        <FormStateViewer form={createMockForm({ isValid: true, isDirty: true, submitCount: 2 })} />
      );

      await user.click(screen.getByRole('tab', { name: /state/i }));

      expect(screen.getByText('Is Valid')).toBeInTheDocument();
      expect(screen.getByText('Is Dirty')).toBeInTheDocument();
      expect(screen.getByText('Submit Count')).toBeInTheDocument();
      expect(getBadgeByText('2')).toBeInTheDocument();
    });

    it('lists dirty and touched fields as badges in the fields tab', async () => {
      const user = userEvent.setup();
      render(
        <FormStateViewer
          form={createMockForm({
            dirtyFields: { name: true },
            touchedFields: { email: true },
          })}
        />
      );

      await user.click(screen.getByRole('tab', { name: /fields/i }));

      expect(screen.getByText('Dirty Fields (1)')).toBeInTheDocument();
      expect(getBadgeByText('name')).toBeInTheDocument();
      expect(screen.getByText('Touched Fields (1)')).toBeInTheDocument();
      expect(getBadgeByText('email')).toBeInTheDocument();
    });

    it('shows empty-state text when no fields are dirty or touched', async () => {
      const user = userEvent.setup();
      render(<FormStateViewer form={createMockForm()} />);

      await user.click(screen.getByRole('tab', { name: /fields/i }));

      expect(screen.getByText('No fields modified yet')).toBeInTheDocument();
      expect(screen.getByText('No fields touched yet')).toBeInTheDocument();
    });
  });

  describe('compact mode', () => {
    it('renders title, validity badge, and values without tabs', () => {
      render(<FormStateViewer form={createMockForm({ values: { name: 'John' } })} compact />);

      expect(screen.getByText('Form State')).toBeInTheDocument();
      expect(getBadgeByText('Valid')).toHaveClass('bg-success-background');
      expect(screen.getByText(/"name": "John"/)).toBeInTheDocument();
      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    });

    it('shows the invalid badge in compact mode', () => {
      render(
        <FormStateViewer
          form={createMockForm({ isValid: false, errors: { name: { message: 'Required' } } })}
          compact
        />
      );

      expect(getBadgeByText('Invalid')).toHaveClass('bg-destructive');
    });
  });

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <FormStateViewer form={createMockForm({ values: { name: 'John' } })} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { useEffect } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useForm, FormProvider } from 'react-hook-form';
import { FormFieldRenderer } from './field-renderer';
import { DataFetcher } from './data-fetcher';
import type { FieldMetadata, FormContext } from './form-schema';

// Wrapper component to provide form context
function FormWrapper({
  children,
  defaultValues = {},
}: {
  children: React.ReactNode;
  defaultValues?: Record<string, unknown>;
}) {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

// Mock form context
const createMockContext = (): FormContext => ({
  schema: { id: 'test', title: 'Test', sections: [] },
  form: {} as FormContext['form'],
  values: {},
  errors: {},
  isSubmitting: false,
  isDirty: false,
  evaluateConditions: () => true,
  fetchData: async () => [],
  registerCustomComponent: vi.fn(),
});

describe('FormFieldRenderer', () => {
  describe('text field', () => {
    it('renders text input', () => {
      const field: FieldMetadata = {
        name: 'username',
        type: 'text',
        label: 'Username',
        placeholder: 'Enter username',
      };

      render(
        <FormWrapper>
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapper>
      );

      expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
    });

    it('displays label', () => {
      const field: FieldMetadata = {
        name: 'name',
        type: 'text',
        label: 'Full Name',
      };

      render(
        <FormWrapper>
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapper>
      );

      expect(screen.getByText('Full Name')).toBeInTheDocument();
    });

    it('shows required indicator when field is required', () => {
      const field: FieldMetadata = {
        name: 'email',
        type: 'text',
        label: 'Email',
        validation: { required: true },
      };

      render(
        <FormWrapper>
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapper>
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('handles disabled state', () => {
      const field: FieldMetadata = {
        name: 'readonly',
        type: 'text',
        label: 'Readonly',
        placeholder: 'Disabled field',
      };

      render(
        <FormWrapper>
          <FormFieldRenderer
            field={field}
            context={createMockContext()}
            customComponents={{}}
            disabled
          />
        </FormWrapper>
      );

      expect(screen.getByPlaceholderText('Disabled field')).toBeDisabled();
    });
  });

  describe('email field', () => {
    it('renders email input', () => {
      const field: FieldMetadata = {
        name: 'email',
        type: 'email',
        label: 'Email',
        placeholder: 'Enter email',
      };

      render(
        <FormWrapper>
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapper>
      );

      const input = screen.getByPlaceholderText('Enter email');
      expect(input).toHaveAttribute('type', 'email');
    });
  });

  describe('number field', () => {
    it('renders number input', () => {
      const field: FieldMetadata = {
        name: 'age',
        type: 'number',
        label: 'Age',
        min: 0,
        max: 120,
      };

      render(
        <FormWrapper>
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapper>
      );

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  describe('textarea field', () => {
    it('renders textarea', () => {
      const field: FieldMetadata = {
        name: 'bio',
        type: 'textarea',
        label: 'Biography',
        placeholder: 'Tell us about yourself',
        rows: 5,
      };

      render(
        <FormWrapper>
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapper>
      );

      const textarea = screen.getByPlaceholderText('Tell us about yourself');
      expect(textarea.tagName).toBe('TEXTAREA');
    });
  });

  describe('select field', () => {
    it('renders select with options', () => {
      const field: FieldMetadata = {
        name: 'country',
        type: 'select',
        label: 'Country',
        options: [
          { label: 'USA', value: 'us' },
          { label: 'Canada', value: 'ca' },
        ],
      };

      render(
        <FormWrapper>
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapper>
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('checkbox field', () => {
    it('renders checkbox', () => {
      const field: FieldMetadata = {
        name: 'agree',
        type: 'checkbox',
        label: 'I agree to terms',
      };

      render(
        <FormWrapper>
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapper>
      );

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByText('I agree to terms')).toBeInTheDocument();
    });
  });

  describe('switch field', () => {
    it('renders switch', () => {
      const field: FieldMetadata = {
        name: 'notifications',
        type: 'switch',
        label: 'Enable Notifications',
      };

      render(
        <FormWrapper>
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapper>
      );

      expect(screen.getByRole('switch')).toBeInTheDocument();
    });
  });

  describe('visibility rules', () => {
    it('hides field when visibility rule evaluates to false', () => {
      const field: FieldMetadata = {
        name: 'hidden_field',
        type: 'text',
        label: 'Hidden Field',
        placeholder: 'Hidden',
        rules: [
          {
            id: 'hide-always',
            conditions: [], // empty conditions always match
            effects: { visible: false },
          },
        ],
      };

      render(
        <FormWrapper>
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapper>
      );

      // Field should not be in the document
      expect(screen.queryByPlaceholderText('Hidden')).not.toBeInTheDocument();
    });

    it('shows field when visibility rule evaluates to true', () => {
      const field: FieldMetadata = {
        name: 'visible_field',
        type: 'text',
        label: 'Visible Field',
        placeholder: 'Visible',
        rules: [
          {
            id: 'show-always',
            conditions: [], // empty conditions always match
            effects: { visible: true },
          },
        ],
      };

      render(
        <FormWrapper>
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapper>
      );

      expect(screen.getByPlaceholderText('Visible')).toBeInTheDocument();
    });
  });

  describe('disabled rules', () => {
    it('disables field when disable rule matches', () => {
      const field: FieldMetadata = {
        name: 'disabled_field',
        type: 'text',
        label: 'Disabled Field',
        placeholder: 'Disabled by rule',
        rules: [
          {
            id: 'disable-always',
            conditions: [],
            effects: { disabled: true },
          },
        ],
      };

      render(
        <FormWrapper>
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapper>
      );

      expect(screen.getByPlaceholderText('Disabled by rule')).toBeDisabled();
    });
  });

  describe('grid layout', () => {
    it('applies grid span style', () => {
      const field: FieldMetadata = {
        name: 'wide_field',
        type: 'text',
        label: 'Wide Field',
        grid: { span: 2 },
      };

      const { container } = render(
        <FormWrapper>
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapper>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ gridColumn: 'span 2' });
    });

    it('defaults to span 1 when grid config is not provided', () => {
      const field: FieldMetadata = {
        name: 'default_field',
        type: 'text',
        label: 'Default Field',
      };

      const { container } = render(
        <FormWrapper>
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapper>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ gridColumn: 'span 1' });
    });
  });

  describe('accessibility', () => {
    it('has no accessibility violations for text input', async () => {
      const field: FieldMetadata = {
        name: 'accessible',
        type: 'text',
        label: 'Accessible Field',
        ariaLabel: 'Accessible input field',
      };

      const { container } = render(
        <FormWrapper>
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('data source', () => {
    beforeEach(() => {
      DataFetcher.clearCache();
    });

    afterEach(() => {
      DataFetcher.resetAdapter();
    });

    it('loads options from static data source', async () => {
      const field: FieldMetadata = {
        name: 'static_select',
        type: 'select',
        label: 'Static Select',
        dataSource: {
          type: 'static',
          options: [
            { label: 'Option A', value: 'a' },
            { label: 'Option B', value: 'b' },
          ],
        },
      };

      render(
        <FormWrapper>
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapper>
      );

      // Wait for async data source loading to complete
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });
  });

  describe('error display', () => {
    // Wrapper that exposes setError for testing error display
    function FormWrapperWithError({
      children,
      fieldName,
      errorMessage,
    }: {
      children: React.ReactNode;
      fieldName: string;
      errorMessage?: string;
    }) {
      const methods = useForm();

      // Set error on mount if provided
      useEffect(() => {
        if (errorMessage) {
          methods.setError(fieldName, {
            type: 'manual',
            message: errorMessage,
          });
        }
      }, [methods, fieldName, errorMessage]);

      return <FormProvider {...methods}>{children}</FormProvider>;
    }

    it('displays error message when field has validation error', () => {
      const field: FieldMetadata = {
        name: 'required_field',
        type: 'text',
        label: 'Required Field',
        placeholder: 'Enter value',
      };

      render(
        <FormWrapperWithError fieldName="required_field" errorMessage="This field is required">
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapperWithError>
      );

      // Error message should be displayed
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('does not display error when field has no error', () => {
      const field: FieldMetadata = {
        name: 'valid_field',
        type: 'text',
        label: 'Valid Field',
        placeholder: 'Enter value',
      };

      render(
        <FormWrapperWithError fieldName="valid_field">
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapperWithError>
      );

      // No error message should be displayed
      expect(screen.queryByText(/required|error/i)).not.toBeInTheDocument();
    });
  });
});

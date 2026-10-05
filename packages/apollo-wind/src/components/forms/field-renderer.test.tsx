import { render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataFetcher } from './data-fetcher';
import { FormFieldRenderer } from './field-renderer';
import type { CustomFieldComponentProps, FieldMetadata, FormContext } from './form-schema';

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

      expect(screen.getByText('*').parentElement).toHaveClass('text-foreground');
      expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
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

  describe('slider field', () => {
    it('renders with static max', () => {
      const field: FieldMetadata = {
        name: 'temperature',
        type: 'slider',
        label: 'Temperature',
        min: 0,
        max: 1,
        step: 0.1,
      };

      render(
        <FormWrapper defaultValues={{ temperature: 0.5 }}>
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapper>
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuemax', '1');
      expect(slider).toHaveAttribute('aria-valuenow', '0.5');
    });

    it('falls back to 100 when neither max nor maxRef is provided', () => {
      const field: FieldMetadata = {
        name: 'value',
        type: 'slider',
        label: 'Value',
      };

      render(
        <FormWrapper defaultValues={{ value: 50 }}>
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapper>
      );

      expect(screen.getByRole('slider')).toHaveAttribute('aria-valuemax', '100');
    });

    it('derives max from another form field via maxRef', () => {
      const field: FieldMetadata = {
        name: 'maxTokens',
        type: 'slider',
        label: 'Max tokens',
        min: 0,
        maxRef: { fromField: 'modelMaxTokens', fallback: 1000 },
      };

      render(
        <FormWrapper defaultValues={{ maxTokens: 500, modelMaxTokens: 32768 }}>
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapper>
      );

      expect(screen.getByRole('slider')).toHaveAttribute('aria-valuemax', '32768');
    });

    it('uses maxRef.fallback when watched field is missing', () => {
      const field: FieldMetadata = {
        name: 'maxTokens',
        type: 'slider',
        label: 'Max tokens',
        maxRef: { fromField: 'modelMaxTokens', fallback: 16384 },
      };

      render(
        <FormWrapper defaultValues={{ maxTokens: 500 }}>
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapper>
      );

      expect(screen.getByRole('slider')).toHaveAttribute('aria-valuemax', '16384');
    });

    it('uses maxRef.fallback when watched value is not a positive number', () => {
      const field: FieldMetadata = {
        name: 'maxTokens',
        type: 'slider',
        label: 'Max tokens',
        maxRef: { fromField: 'modelMaxTokens', fallback: 8192 },
      };

      render(
        <FormWrapper defaultValues={{ maxTokens: 500, modelMaxTokens: 'not-a-number' }}>
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapper>
      );

      expect(screen.getByRole('slider')).toHaveAttribute('aria-valuemax', '8192');
    });

    it('maxRef takes precedence over static max', () => {
      const field: FieldMetadata = {
        name: 'maxTokens',
        type: 'slider',
        label: 'Max tokens',
        max: 999,
        maxRef: { fromField: 'modelMaxTokens', fallback: 16384 },
      };

      render(
        <FormWrapper defaultValues={{ maxTokens: 500, modelMaxTokens: 4096 }}>
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapper>
      );

      expect(screen.getByRole('slider')).toHaveAttribute('aria-valuemax', '4096');
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

  describe('changed fields', () => {
    const field: FieldMetadata = {
      name: 'url',
      type: 'text',
      label: 'URL',
    };

    const renderField = (context: FormContext) =>
      render(
        <FormWrapper>
          <FormFieldRenderer field={field} context={context} customComponents={{}} />
        </FormWrapper>
      ).container.firstChild as HTMLElement;

    it('always tags the field with data-field-name', () => {
      const wrapper = renderField(createMockContext());

      expect(wrapper).toHaveAttribute('data-field-name', 'url');
      expect(wrapper).not.toHaveAttribute('data-changed');
      expect(wrapper.className).toBe('');
    });

    it('flags a field named in context.changedFields and labels it for screen readers', () => {
      const wrapper = renderField({
        ...createMockContext(),
        changedFields: new Set(['url']),
        changedFieldLabel: 'Geändert',
      });

      expect(wrapper).toHaveAttribute('data-changed', 'true');
      expect(wrapper.className).toContain('border-warning');
      expect(screen.getByText('Geändert')).toHaveClass('sr-only');
    });

    it('falls back to an English screen-reader label', () => {
      renderField({ ...createMockContext(), changedFields: new Set(['url']) });

      expect(screen.getByText('Changed')).toHaveClass('sr-only');
    });

    it('does not flag a field absent from context.changedFields', () => {
      const wrapper = renderField({
        ...createMockContext(),
        changedFields: new Set(['other_field']),
      });

      expect(wrapper.className).toBe('');
      expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    });

    describe('describes every control with the changed note', () => {
      const changed = (name: string): FormContext => ({
        ...createMockContext(),
        changedFields: new Set([name]),
      });

      function Custom(props: CustomFieldComponentProps) {
        return <input aria-label="Custom" aria-describedby={props['aria-describedby']} />;
      }

      const cases: { field: FieldMetadata; getControl: () => HTMLElement }[] = [
        {
          field: { name: 'f', type: 'text', label: 'Text' },
          getControl: () => screen.getByRole('textbox'),
        },
        {
          field: {
            name: 'f',
            type: 'select',
            label: 'Pick',
            options: [{ label: 'A', value: 'a' }],
          },
          getControl: () => screen.getByRole('combobox'),
        },
        {
          field: { name: 'f', type: 'checkbox', label: 'Agree' },
          getControl: () => screen.getByRole('checkbox'),
        },
        {
          field: { name: 'f', type: 'switch', label: 'On' },
          getControl: () => screen.getByRole('switch'),
        },
        {
          field: { name: 'f', type: 'custom', label: 'Custom', component: 'Custom' },
          getControl: () => screen.getByRole('textbox', { name: 'Custom' }),
        },
        {
          field: { name: 'f', type: 'string-list', label: 'Items', defaultValue: ['a'] },
          getControl: () => screen.getByRole('textbox'),
        },
        // A badge renders the field anatomy (ModeAwareField) rather than the plain layout.
        {
          field: { name: 'f', type: 'text', label: 'Badged', badge: 'Beta' },
          getControl: () => screen.getByRole('textbox'),
        },
        {
          field: { name: 'f', type: 'custom', label: 'Custom', component: 'Custom', badge: 'Beta' },
          getControl: () => screen.getByRole('textbox', { name: 'Custom' }),
        },
      ];

      it.each(cases)('$field.type: described as changed only when flagged', ({
        field,
        getControl,
      }) => {
        const { unmount } = render(
          <FormWrapper>
            <FormFieldRenderer field={field} context={changed('f')} customComponents={{ Custom }} />
          </FormWrapper>
        );
        expect(getControl()).toHaveAccessibleDescription('Changed');
        unmount();

        render(
          <FormWrapper>
            <FormFieldRenderer
              field={field}
              context={changed('other')}
              customComponents={{ Custom }}
            />
          </FormWrapper>
        );
        expect(getControl()).not.toHaveAttribute('aria-describedby');
      });

      it('keeps the error message in the description', async () => {
        function WithError({ children }: { children: React.ReactNode }) {
          const methods = useForm();
          useEffect(() => {
            methods.setError('f', { type: 'manual', message: 'Required' });
          }, [methods]);
          return <FormProvider {...methods}>{children}</FormProvider>;
        }

        render(
          <WithError>
            <FormFieldRenderer
              field={{ name: 'f', type: 'text', label: 'Text' }}
              context={changed('f')}
              customComponents={{}}
            />
          </WithError>
        );

        await waitFor(() =>
          expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Required Changed')
        );
      });

      it("merges a custom field's own componentProps aria-describedby", () => {
        render(
          <FormWrapper>
            <span id="hint">Hint</span>
            <FormFieldRenderer
              field={{
                name: 'f',
                type: 'custom',
                label: 'Custom',
                component: 'Custom',
                componentProps: { 'aria-describedby': 'hint' },
              }}
              context={changed('f')}
              customComponents={{ Custom }}
            />
          </FormWrapper>
        );

        expect(screen.getByRole('textbox', { name: 'Custom' })).toHaveAccessibleDescription(
          'Hint Changed'
        );
      });
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

    it('associates a text field with its error via aria-describedby and aria-errormessage', () => {
      const field: FieldMetadata = {
        name: 'text_field',
        type: 'text',
        label: 'Text Field',
      };

      render(
        <FormWrapperWithError fieldName="text_field" errorMessage="Enter a value">
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapperWithError>
      );

      const input = screen.getByRole('textbox');
      const message = screen.getByText('Enter a value');
      expect(input).toHaveAttribute('aria-describedby', 'text_field-error');
      expect(input).toHaveAttribute('aria-errormessage', 'text_field-error');
      expect(message).toHaveAttribute('id', 'text_field-error');
    });

    it('associates a select field with its error via aria-describedby and aria-errormessage', async () => {
      const field: FieldMetadata = {
        name: 'select_field',
        type: 'select',
        label: 'Select Field',
        options: [{ label: 'One', value: '1' }],
      };

      render(
        <FormWrapperWithError fieldName="select_field" errorMessage="Choose an option">
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapperWithError>
      );

      const trigger = screen.getByRole('combobox');
      const message = screen.getByText('Choose an option');
      expect(trigger).toHaveAttribute('aria-describedby', 'select_field-error');
      expect(trigger).toHaveAttribute('aria-errormessage', 'select_field-error');
      expect(message).toHaveAttribute('id', 'select_field-error');
    });

    it('associates a checkbox field with its error via aria-describedby and aria-errormessage', () => {
      const field: FieldMetadata = {
        name: 'checkbox_field',
        type: 'checkbox',
        label: 'Checkbox Field',
      };

      render(
        <FormWrapperWithError fieldName="checkbox_field" errorMessage="Accept to continue">
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapperWithError>
      );

      const checkbox = screen.getByRole('checkbox');
      const message = screen.getByText('Accept to continue');
      expect(checkbox).toHaveAttribute('aria-describedby', 'checkbox_field-error');
      expect(checkbox).toHaveAttribute('aria-errormessage', 'checkbox_field-error');
      expect(message).toHaveAttribute('id', 'checkbox_field-error');
    });

    it('associates a date field with its error via aria-describedby and aria-errormessage', () => {
      const field: FieldMetadata = {
        name: 'date_field',
        type: 'date',
        label: 'Date Field',
      };

      render(
        <FormWrapperWithError fieldName="date_field" errorMessage="Select a date">
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapperWithError>
      );

      const trigger = screen.getByRole('button');
      const message = screen.getByText('Select a date');
      expect(trigger).toHaveAttribute('aria-describedby', 'date_field-error');
      expect(trigger).toHaveAttribute('aria-errormessage', 'date_field-error');
      expect(message).toHaveAttribute('id', 'date_field-error');
    });

    it('associates every row of a string-list field with the same error id', () => {
      const field: FieldMetadata = {
        name: 'list_field',
        type: 'string-list',
        label: 'List Field',
        defaultValue: ['First item'],
      };

      render(
        <FormWrapperWithError fieldName="list_field" errorMessage="Add at least one item">
          <FormFieldRenderer field={field} context={createMockContext()} customComponents={{}} />
        </FormWrapperWithError>
      );

      const message = screen.getByText('Add at least one item');
      expect(message).toHaveAttribute('id', 'list_field-error');
      for (const textbox of screen.getAllByRole('textbox')) {
        expect(textbox).toHaveAttribute('aria-describedby', 'list_field-error');
        expect(textbox).toHaveAttribute('aria-errormessage', 'list_field-error');
      }
    });
  });
});

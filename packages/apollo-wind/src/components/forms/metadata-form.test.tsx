import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { MetadataForm } from './metadata-form';
import type { FormPlugin, FormSchema } from './form-schema';

// Basic form schema for tests
const basicSchema: FormSchema = {
  id: 'test-form',
  title: 'Test Form',
  sections: [
    {
      id: 'section-1',
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Name',
          placeholder: 'Enter name',
          defaultValue: '',
        },
        {
          name: 'email',
          type: 'email',
          label: 'Email',
          placeholder: 'Enter email',
          defaultValue: '',
        },
      ],
    },
  ],
};

// Form with validation
const validationSchema: FormSchema = {
  id: 'validation-form',
  title: 'Validation Form',
  sections: [
    {
      id: 'section-1',
      fields: [
        {
          name: 'required_field',
          type: 'text',
          label: 'Required Field',
          validation: { required: true },
          defaultValue: '',
        },
        {
          name: 'optional_field',
          type: 'text',
          label: 'Optional Field',
          defaultValue: '',
        },
      ],
    },
  ],
};

// Form with conditional visibility
const conditionalSchema: FormSchema = {
  id: 'conditional-form',
  title: 'Conditional Form',
  sections: [
    {
      id: 'section-1',
      fields: [
        {
          name: 'toggle',
          type: 'text',
          label: 'Toggle',
          placeholder: 'Enter toggle value',
          defaultValue: '',
        },
        {
          name: 'conditional_required',
          type: 'text',
          label: 'Conditional Required',
          placeholder: 'Conditional field',
          validation: { required: true },
          defaultValue: '',
          rules: [
            {
              id: 'hide-when-aaa',
              conditions: [{ when: 'toggle', is: 'aaa' }],
              effects: { visible: false },
            },
          ],
        },
      ],
    },
  ],
};

describe('MetadataForm', () => {
  describe('rendering', () => {
    it('renders form with fields', () => {
      render(<MetadataForm schema={basicSchema} />);

      expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    });

    it('renders section title when provided', () => {
      const schemaWithTitle: FormSchema = {
        id: 'form',
        title: 'Form',
        sections: [
          {
            id: 's1',
            title: 'Personal Info',
            fields: [{ name: 'name', type: 'text', label: 'Name', defaultValue: '' }],
          },
        ],
      };

      render(<MetadataForm schema={schemaWithTitle} />);
      expect(screen.getByText('Personal Info')).toBeInTheDocument();
    });

    it('renders submit button by default', () => {
      render(<MetadataForm schema={basicSchema} />);
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('renders custom actions', () => {
      const schemaWithActions: FormSchema = {
        ...basicSchema,
        actions: [
          { id: 'save', type: 'submit', label: 'Save Form' },
          { id: 'cancel', type: 'reset', label: 'Cancel' },
        ],
      };

      render(<MetadataForm schema={schemaWithActions} />);
      expect(screen.getByRole('button', { name: 'Save Form' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('applies disabled state to form', () => {
      render(<MetadataForm schema={basicSchema} disabled />);

      const nameInput = screen.getByPlaceholderText('Enter name');
      const emailInput = screen.getByPlaceholderText('Enter email');

      expect(nameInput).toBeDisabled();
      expect(emailInput).toBeDisabled();
    });

    it('applies autoComplete attribute', () => {
      const { container } = render(<MetadataForm schema={basicSchema} autoComplete="off" />);
      const form = container.querySelector('form');
      expect(form).toHaveAttribute('autocomplete', 'off');
    });
  });

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<MetadataForm schema={basicSchema} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('form submission', () => {
    it('calls onSubmit with form data', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();

      render(<MetadataForm schema={basicSchema} onSubmit={handleSubmit} />);

      await user.type(screen.getByPlaceholderText('Enter name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('Enter email'), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Doe',
            email: 'john@example.com',
          })
        );
      });
    });

    it('prevents submission with validation errors', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();

      render(<MetadataForm schema={validationSchema} onSubmit={handleSubmit} />);

      // Try to submit without filling required field
      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(handleSubmit).not.toHaveBeenCalled();
      });
    });

    it('shows validation error for required field', async () => {
      const user = userEvent.setup();

      render(<MetadataForm schema={validationSchema} />);

      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });
    });
  });

  describe('dynamic validation', () => {
    it('skips validation for hidden required fields', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();

      render(<MetadataForm schema={conditionalSchema} onSubmit={handleSubmit} />);

      // Type "aaa" to hide the conditional_required field
      await user.type(screen.getByPlaceholderText('Enter toggle value'), 'aaa');

      // Submit should work because hidden fields are not validated
      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            toggle: 'aaa',
          })
        );
      });
    });

    it('validates visible required fields', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();

      render(<MetadataForm schema={conditionalSchema} onSubmit={handleSubmit} />);

      // Type something other than "aaa" - field stays visible
      await user.type(screen.getByPlaceholderText('Enter toggle value'), 'bbb');

      // Submit should fail because conditional_required is visible but empty
      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(handleSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('multi-step form', () => {
    const multiStepSchema: FormSchema = {
      id: 'wizard',
      title: 'Wizard Form',
      steps: [
        {
          id: 'step-1',
          title: 'Step 1',
          sections: [
            {
              id: 's1',
              fields: [
                {
                  name: 'field1',
                  type: 'text',
                  label: 'Field 1',
                  placeholder: 'Step 1 field',
                  defaultValue: '',
                },
              ],
            },
          ],
        },
        {
          id: 'step-2',
          title: 'Step 2',
          sections: [
            {
              id: 's2',
              fields: [
                {
                  name: 'field2',
                  type: 'text',
                  label: 'Field 2',
                  placeholder: 'Step 2 field',
                  defaultValue: '',
                },
              ],
            },
          ],
        },
      ],
    };

    it('renders first step initially', () => {
      render(<MetadataForm schema={multiStepSchema} />);

      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Step 1 field')).toBeInTheDocument();
    });

    it('navigates to next step', async () => {
      const user = userEvent.setup();
      render(<MetadataForm schema={multiStepSchema} />);

      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Step 2')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Step 2 field')).toBeInTheDocument();
      });
    });

    it('navigates back to previous step', async () => {
      const user = userEvent.setup();
      render(<MetadataForm schema={multiStepSchema} />);

      // Go to step 2
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Step 2')).toBeInTheDocument();
      });

      // Go back to step 1
      await user.click(screen.getByRole('button', { name: /previous/i }));

      await waitFor(() => {
        expect(screen.getByText('Step 1')).toBeInTheDocument();
      });
    });
  });

  describe('tabbed multi-step form (stepVariant="tabs")', () => {
    const tabbedSchema: FormSchema = {
      id: 'tabbed',
      title: 'Tabbed Form',
      steps: [
        {
          id: 'parameters',
          title: 'Parameters',
          sections: [
            {
              id: 'p',
              fields: [
                {
                  name: 'field1',
                  type: 'text',
                  label: 'Field 1',
                  placeholder: 'Params field',
                  defaultValue: '',
                },
              ],
            },
          ],
        },
        {
          id: 'advanced',
          title: 'Advanced',
          sections: [
            {
              id: 'a',
              fields: [
                {
                  name: 'field2',
                  type: 'text',
                  label: 'Field 2',
                  placeholder: 'Advanced field',
                  defaultValue: '',
                },
              ],
            },
          ],
        },
        // A step with no sections must not produce a tab (e.g. a trigger with no parameters).
        { id: 'empty', title: 'Should Not Render', sections: [] },
      ],
    };

    it('renders one tab per non-empty step and omits empty steps', () => {
      render(<MetadataForm schema={tabbedSchema} stepVariant="tabs" />);

      expect(screen.getByRole('tab', { name: 'Parameters' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Advanced' })).toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: 'Should Not Render' })).not.toBeInTheDocument();
    });

    it('keeps a value entered in one tab after switching tabs (single shared form instance)', async () => {
      const user = userEvent.setup();
      render(<MetadataForm schema={tabbedSchema} stepVariant="tabs" />);

      await user.type(screen.getByPlaceholderText('Params field'), 'hello');

      // Switch to the Advanced tab, then back to Parameters.
      await user.click(screen.getByRole('tab', { name: 'Advanced' }));
      await waitFor(() =>
        expect(screen.getByPlaceholderText('Advanced field')).toBeInTheDocument()
      );

      await user.click(screen.getByRole('tab', { name: 'Parameters' }));

      // Value survives because every tab shares one react-hook-form instance.
      await waitFor(() => expect(screen.getByPlaceholderText('Params field')).toHaveValue('hello'));
    });

    it('renders no Submit action when every step is empty (no phantom default Submit)', () => {
      const allEmpty: FormSchema = {
        id: 'all-empty',
        title: 'All Empty',
        steps: [{ id: 'empty', title: 'Empty', sections: [] }],
      };
      render(<MetadataForm schema={allEmpty} stepVariant="tabs" />);

      // TabbedStepForm renders nothing, so FormActions (and its default Submit) is suppressed.
      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
    });

    it("badges a tab with the count of its errored fields, including a tab that isn't active", async () => {
      // Seed an error on `field2`, which lives on the (inactive) Advanced tab.
      const seedError: FormPlugin = {
        name: 'seed-error',
        version: '1.0.0',
        onFormInit: (context) => {
          context.form.setError('field2', { message: 'Bad value' });
        },
      };

      render(<MetadataForm schema={tabbedSchema} stepVariant="tabs" plugins={[seedError]} />);

      // The Advanced tab (not active) shows a "1" badge for its single errored field.
      const advancedTab = await screen.findByRole('tab', { name: /Advanced/ });
      await waitFor(() => expect(within(advancedTab).getByText('1')).toBeInTheDocument());

      // The Parameters tab has no errored field, so it stays badge-free.
      expect(screen.getByRole('tab', { name: 'Parameters' })).toBeInTheDocument();
      expect(within(screen.getByRole('tab', { name: 'Parameters' })).queryByText('1')).toBeNull();
    });

    it('counts each issue of a composite field whose error is an array (not just the field)', async () => {
      // A composite field (e.g. a connector editor) surfaces several issues at once,
      // stored as an array of errors under one field name. The badge should reflect
      // the issue count, not collapse the whole field to a single "1".
      const seedArrayError: FormPlugin = {
        name: 'seed-array-error',
        version: '1.0.0',
        onFormInit: (context) => {
          context.form.setError('field1.0', { message: 'Channel is required' });
          context.form.setError('field1.1', {
            message: 'Timestamp is required',
          });
          context.form.setError('field1.2', { message: 'Message is required' });
        },
      };

      render(<MetadataForm schema={tabbedSchema} stepVariant="tabs" plugins={[seedArrayError]} />);

      // `field1` lives on Parameters; its three issues make the badge read "3".
      const parametersTab = await screen.findByRole('tab', {
        name: /Parameters/,
      });
      await waitFor(() => expect(within(parametersTab).getByText('3')).toBeInTheDocument());
    });
  });
});

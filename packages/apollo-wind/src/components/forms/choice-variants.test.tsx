import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { FormFieldRenderer } from './field-renderer';
import type { FieldMetadata, FieldOption, FormContext } from './form-schema';

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

const context: FormContext = {
  schema: { id: 'test', title: 'Test', sections: [] },
  form: {} as FormContext['form'],
  values: {},
  errors: {},
  isSubmitting: false,
  isDirty: false,
  evaluateConditions: () => true,
  fetchData: async () => [],
  registerCustomComponent: vi.fn(),
};

const options: FieldOption[] = [
  { label: 'Approve', value: 'approve', description: 'Send it on', tag: 'Agent' },
  { label: 'Reject', value: 'reject', description: 'Stop here' },
  { label: 'Escalate', value: 'escalate' },
];

function renderField(field: FieldMetadata, defaultValues: Record<string, unknown> = {}) {
  return render(
    <FormWrapper defaultValues={defaultValues}>
      <FormFieldRenderer field={field} context={context} customComponents={{}} />
    </FormWrapper>
  );
}

describe.each(['segmented', 'chips'] as const)('radio variant %s', (variant) => {
  const field: FieldMetadata = {
    name: 'decision',
    type: 'radio',
    label: 'Decision',
    variant,
    options,
    validation: { required: true },
  };

  it('renders a named radiogroup of radios with the shared label', () => {
    renderField(field);
    expect(screen.getByRole('radiogroup', { name: /Decision/ })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByText('Decision').closest('[data-slot="form-field"]')).not.toBeNull();
  });

  it('marks the selected option aria-checked', () => {
    renderField(field, { decision: 'reject' });
    expect(screen.getByRole('radio', { name: 'Reject' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /Approve/ })).toHaveAttribute('aria-checked', 'false');
  });

  it('selects on click and cannot be deselected', async () => {
    const user = userEvent.setup();
    renderField(field);
    await user.click(screen.getByRole('radio', { name: 'Reject' }));
    expect(screen.getByRole('radio', { name: 'Reject' })).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByRole('radio', { name: 'Reject' }));
    expect(screen.getByRole('radio', { name: 'Reject' })).toHaveAttribute('aria-checked', 'true');
  });

  it('moves focus with arrow keys', async () => {
    const user = userEvent.setup();
    renderField(field);
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Reject' })).toHaveFocus();
  });

  it('shows the option tag as a badge', () => {
    renderField(field);
    expect(screen.getByText('Agent')).toHaveAttribute('data-slot', 'badge');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderField(field);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('radio variant cards', () => {
  const field: FieldMetadata = {
    name: 'decision',
    type: 'radio',
    label: 'Decision',
    variant: 'cards',
    options,
  };

  it('renders each option as a radio with title, description and tag', () => {
    renderField(field);
    expect(screen.getByRole('radiogroup', { name: 'Decision' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Approve' })).toHaveAccessibleDescription(
      'Send it on'
    );
    expect(screen.getByText('Agent')).toHaveAttribute('data-slot', 'badge');
    expect(screen.getByText('Stop here')).toBeInTheDocument();
  });

  it('selects on click and moves with arrow keys', async () => {
    const user = userEvent.setup();
    renderField(field);
    await user.click(screen.getByRole('radio', { name: 'Approve' }));
    expect(screen.getByRole('radio', { name: 'Approve' })).toBeChecked();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Reject' })).toBeChecked();
  });

  it('disables a disabled option', () => {
    renderField({ ...field, options: [{ label: 'A', value: 'a', disabled: true }] });
    expect(screen.getByRole('radio', { name: 'A' })).toBeDisabled();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderField(field);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('multiselect variant chips', () => {
  const field: FieldMetadata = {
    name: 'tags',
    type: 'multiselect',
    label: 'Reasons',
    variant: 'chips',
    options,
  };

  it('renders a labelled group of pressable chips', () => {
    renderField(field, { tags: ['reject'] });
    expect(screen.getByRole('group', { name: 'Reasons' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Approve/ })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('toggles several chips on and off', async () => {
    const user = userEvent.setup();
    renderField(field);
    await user.click(screen.getByRole('button', { name: 'Reject' }));
    await user.click(screen.getByRole('button', { name: 'Escalate' }));
    expect(screen.getByRole('button', { name: 'Reject' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Escalate' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await user.click(screen.getByRole('button', { name: 'Reject' }));
    expect(screen.getByRole('button', { name: 'Reject' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderField(field);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('display field', () => {
  const base: FieldMetadata = { name: 'summary', type: 'display', label: 'Summary' };

  it('renders label and value without any input', () => {
    renderField(base, { summary: 'Invoice 4411' });
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Invoice 4411')).toBeInTheDocument();
    expect(document.querySelector('input, textarea')).toBeNull();
  });

  it('renders a callout for callout fields', () => {
    renderField({ ...base, callout: true }, { summary: 'Long explanation' });
    const callout = document.querySelector('[data-slot="display-callout"]');
    expect(callout).not.toBeNull();
    expect(callout).toHaveTextContent('Long explanation');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('renders markdown in a callout', () => {
    renderField({ ...base, callout: true, format: 'markdown' }, { summary: 'This is **bold**' });
    expect(screen.getByText('bold').tagName).toBe('STRONG');
  });

  it('shows the matching option label, joined for arrays', () => {
    const withOptions = {
      ...base,
      options: [
        { label: 'Bank mismatch', value: 'bank' },
        { label: 'Missing tax ID', value: 'tax' },
      ],
    };
    renderField(withOptions, { summary: 'bank' });
    expect(screen.getByText('Bank mismatch')).toBeInTheDocument();
  });

  it('joins option labels for array values', () => {
    const withOptions = {
      ...base,
      options: [
        { label: 'Bank mismatch', value: 'bank' },
        { label: 'Missing tax ID', value: 'tax' },
      ],
    };
    renderField(withOptions, { summary: ['bank', 'tax'] });
    expect(screen.getByText('Bank mismatch, Missing tax ID')).toBeInTheDocument();
  });

  it('shows the badge next to the value when not a callout', () => {
    renderField({ ...base, badge: '95% confident' }, { summary: 'Text' });
    expect(screen.getByText('95% confident')).toHaveAttribute('data-slot', 'badge');
    expect(document.querySelector('[data-slot="display-value"]')).toContainElement(
      screen.getByText('95% confident')
    );
    expect(document.querySelector('[data-slot="display-callout"]')).toBeNull();
  });

  it('shows the badge in the callout header', () => {
    renderField({ ...base, callout: true, badge: '95% confident' }, { summary: 'Text' });
    const callout = document.querySelector('[data-slot="display-callout"]');
    expect(callout).toContainElement(screen.getByText('95% confident'));
  });

  it('renders nothing for an empty value', () => {
    renderField(base, {});
    expect(document.querySelector('[data-slot="display-value"]')).toBeNull();
    expect(document.querySelector('[data-slot="display-callout"]')).toBeNull();
  });

  it('renders emptyText for an empty value', () => {
    renderField({ ...base, emptyText: 'Nothing yet' }, {});
    expect(screen.getByText('Nothing yet')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderField({ ...base, callout: true }, { summary: 'Text' });
    expect(await axe(container)).toHaveNoViolations();
  });
});

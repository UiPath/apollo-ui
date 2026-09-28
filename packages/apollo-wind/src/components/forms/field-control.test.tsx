import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FIELD_CONTROL_GEOMETRY, FieldControl, type FieldControlFormField } from './field-control';
import type { FieldMetadata } from './form-schema';

function binding(value: unknown = undefined): FieldControlFormField {
  return {
    value,
    onChange: vi.fn(),
    onBlur: vi.fn(),
    name: 'title',
    ref: vi.fn(),
  };
}

const textField: FieldMetadata = {
  name: 'title',
  type: 'text',
  label: 'Title',
  description: 'Shown in the header',
};

describe('FieldControl', () => {
  it('renders the bare control, without label, description or error', () => {
    const { container } = render(<FieldControl field={textField} formField={binding('Hi')} />);

    expect(container.children).toHaveLength(1);
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'title');
    expect(screen.getByRole('textbox')).toHaveValue('Hi');
    expect(screen.queryByText('Title')).toBeNull();
    expect(screen.queryByText('Shown in the header')).toBeNull();
  });

  it('points an invalid control at the field error id', () => {
    render(<FieldControl field={textField} formField={binding()} invalid />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'title-error');
    expect(input).toHaveAttribute('aria-errormessage', 'title-error');
  });

  it('leaves a valid control without error wiring', () => {
    render(<FieldControl field={textField} formField={binding()} />);

    const input = screen.getByRole('textbox');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('writes numbers from a number field', () => {
    const formField = binding('');
    render(<FieldControl field={{ ...textField, type: 'number' }} formField={formField} />);

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '4' } });
    expect(formField.onChange).toHaveBeenCalledWith(4);
  });

  it('renders nothing for a custom field', () => {
    const { container } = render(
      <FieldControl
        field={{ name: 'x', type: 'custom', label: 'X', component: 'Widget' }}
        formField={binding()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe('FIELD_CONTROL_GEOMETRY', () => {
  it('marks only the free-text field types insertable', () => {
    const insertable = Object.entries(FIELD_CONTROL_GEOMETRY)
      .filter(([, geometry]) => geometry?.insertable)
      .map(([fieldType]) => fieldType);
    expect(insertable.sort()).toEqual(['email', 'text', 'textarea']);
  });

  it('grows the field types whose content can wrap', () => {
    expect(FIELD_CONTROL_GEOMETRY.textarea?.layout).toBe('grow');
    expect(FIELD_CONTROL_GEOMETRY.multiselect?.layout).toBe('grow');
    expect(FIELD_CONTROL_GEOMETRY.file?.layout).toBe('grow');
    expect(FIELD_CONTROL_GEOMETRY.text?.layout).toBe('row');
  });

  it('draws no box around booleans, which the label reaches by id', () => {
    for (const fieldType of ['switch', 'checkbox'] as const) {
      expect(FIELD_CONTROL_GEOMETRY[fieldType]).toMatchObject({
        variant: 'none',
        labelTarget: 'labelledby',
      });
    }
  });
});

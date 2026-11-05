import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InsertVariableAction } from '@/components/ui/field-actions/insert-variable-action';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  QuickFormFieldAiAssist,
  QuickFormFieldInsertVariable,
  QuickFormFieldTypePicker,
} from './components/header-actions';
import { useQuickFormFieldHeader } from './components/header-context';
import { QuickFormField } from './quick-form-field';

const VARIABLES = [{ label: 'Item ID', value: 'item.id' }];

function HeaderProbe() {
  const header = useQuickFormFieldHeader();
  return <span data-testid="probe">{header ? JSON.stringify(header) : 'none'}</span>;
}

describe('QuickFormField composed header actions', () => {
  it('renders them in the order given', () => {
    render(
      <QuickFormField
        variables={VARIABLES}
        onValueChange={vi.fn()}
        headerActions={
          <>
            <QuickFormFieldInsertVariable />
            <button type="button">Remove</button>
            <QuickFormFieldTypePicker onValueChange={vi.fn()} />
          </>
        }
      />
    );
    const names = screen
      .getAllByRole('button')
      .map((b) => b.getAttribute('aria-label') ?? b.textContent)
      .filter((n) => n === 'Insert variable' || n === 'Remove' || n === 'Field type');
    expect(names).toEqual(['Insert variable', 'Remove', 'Field type']);
  });

  it('inserts at the caret from a composed Insert variable', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <QuickFormField
        locked={false}
        value="hello"
        onValueChange={onValueChange}
        variables={VARIABLES}
        headerActions={<QuickFormFieldInsertVariable />}
      />
    );
    const input = screen.getByPlaceholderText('String value') as HTMLInputElement;
    input.focus();
    input.setSelectionRange(0, 0);
    fireEvent.select(input);

    await user.click(screen.getByRole('button', { name: 'Insert variable' }));
    await user.click(screen.getByRole('option', { name: 'Item ID' }));
    expect(onValueChange).toHaveBeenCalledWith('item.idhello');
  });

  it('hands a composed insert to onInsertVariable with the entry as supplied', async () => {
    const user = userEvent.setup();
    const onInsertVariable = vi.fn();
    const entry = { label: 'Item ID', value: 'item.id', type: 'string' };
    render(
      <QuickFormField
        onValueChange={vi.fn()}
        onInsertVariable={onInsertVariable}
        variables={[entry]}
        headerActions={<QuickFormFieldInsertVariable />}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Insert variable' }));
    await user.click(screen.getByRole('option', { name: /Item ID/ }));
    expect(onInsertVariable).toHaveBeenCalledWith(entry, { value: '', caret: null });
  });

  it('replaces each built-in it stands for, and gives it back once unmounted', () => {
    const props = {
      showFieldActions: true,
      onValueChange: vi.fn(),
      variables: VARIABLES,
      onFieldTypeChange: vi.fn(),
      onGenerateWithAi: vi.fn(),
    };
    const { rerender } = render(
      <QuickFormField
        {...props}
        headerActions={
          <>
            <QuickFormFieldTypePicker onValueChange={vi.fn()} />
            <QuickFormFieldAiAssist onGenerate={vi.fn()} />
            <QuickFormFieldInsertVariable />
          </>
        }
      />
    );
    expect(screen.getAllByRole('button', { name: 'Field type' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'AI assist' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Insert variable' })).toHaveLength(1);

    rerender(<QuickFormField {...props} />);
    expect(screen.getAllByRole('button', { name: 'Field type' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'AI assist' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Insert variable' })).toHaveLength(1);
  });

  it("shows the field's type and offers the given types", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <QuickFormField
        fieldType="integer"
        strings={{ typeLabels: { integer: 'Ganzzahl' } }}
        headerActions={
          <QuickFormFieldTypePicker types={['string', 'integer']} onValueChange={onValueChange} />
        }
      />
    );
    const trigger = screen.getByRole('button', { name: 'Field type' });
    expect(trigger).toHaveTextContent('Ganzzahl');

    await user.click(trigger);
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    await user.click(screen.getByRole('menuitem', { name: 'String' }));
    expect(onValueChange).toHaveBeenCalledWith('string');
  });

  it("words AI assist's hint from the field's type, mode and strings", async () => {
    const user = userEvent.setup();
    render(
      <QuickFormField
        fieldType="date"
        mode="expression"
        strings={{
          typeLabels: { date: 'Datum' },
          aiOutputLabel: (type, isExpression) => `${type}-${isExpression ? 'Ausdruck' : 'Wert'}`,
          aiOutputHint: (output) => `Ausgabe: ${output}`,
        }}
        headerActions={<QuickFormFieldAiAssist onGenerate={vi.fn()} />}
      />
    );
    await user.click(screen.getByRole('button', { name: 'AI assist' }));
    expect(screen.getByText('Ausgabe: Datum-Ausdruck')).toBeInTheDocument();
  });

  it('follows the field’s compact, unless an action sets its own', () => {
    const textOf = (name: string) =>
      screen.getByRole('button', { name }).querySelector('span') as HTMLElement;
    const actions = (
      <>
        <QuickFormFieldTypePicker onValueChange={vi.fn()} />
        <QuickFormFieldInsertVariable compact />
        <InsertVariableAction
          variables={VARIABLES}
          onInsert={vi.fn()}
          compact={false}
          strings={{ ariaLabel: 'Direct' }}
        />
      </>
    );
    const { rerender } = render(
      <QuickFormField variables={VARIABLES} onValueChange={vi.fn()} headerActions={actions} />
    );
    expect(textOf('Field type')).not.toHaveClass('!hidden');
    expect(textOf('Insert variable')).toHaveClass('!hidden');
    expect(textOf('Direct')).not.toHaveClass('!hidden');

    rerender(
      <QuickFormField
        compact
        variables={VARIABLES}
        onValueChange={vi.fn()}
        headerActions={actions}
      />
    );
    expect(textOf('Field type')).toHaveClass('!hidden');
    expect(textOf('Insert variable')).toHaveClass('!hidden');
    expect(textOf('Direct')).not.toHaveClass('!hidden');
  });

  it('disables them while the field is disabled', () => {
    render(
      <QuickFormField
        disabled
        onValueChange={vi.fn()}
        variables={VARIABLES}
        headerActions={
          <>
            <QuickFormFieldTypePicker onValueChange={vi.fn()} />
            <QuickFormFieldAiAssist onGenerate={vi.fn()} />
            <QuickFormFieldInsertVariable />
          </>
        }
      />
    );
    expect(screen.getByRole('button', { name: 'Field type' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'AI assist' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Insert variable' })).toBeDisabled();
  });

  it('disables Insert variable while the value is read-only', () => {
    render(
      <QuickFormField variables={VARIABLES} headerActions={<QuickFormFieldInsertVariable />} />
    );
    expect(screen.getByRole('button', { name: 'Insert variable' })).toBeDisabled();
  });

  it('drops Insert variable in variable mode, and outside a field', () => {
    render(
      <QuickFormField
        mode="variable"
        valueModes={['literal', 'variable']}
        onValueChange={vi.fn()}
        variables={VARIABLES}
        headerActions={<QuickFormFieldInsertVariable />}
      />
    );
    expect(screen.queryByRole('button', { name: 'Insert variable' })).toBeNull();

    render(<QuickFormFieldInsertVariable />);
    expect(screen.queryByRole('button', { name: 'Insert variable' })).toBeNull();
  });

  it('renders the type picker and AI assist outside a field', () => {
    render(
      <TooltipProvider>
        <QuickFormFieldTypePicker value="boolean" onValueChange={vi.fn()} />
        <QuickFormFieldAiAssist onGenerate={vi.fn()} />
      </TooltipProvider>
    );
    expect(screen.getByRole('button', { name: 'Field type' })).toHaveTextContent('Boolean');
    expect(screen.getByRole('button', { name: 'AI assist' })).toBeEnabled();
  });

  it("gives a custom action the field's header state", () => {
    render(
      <QuickFormField
        disabled
        compact
        fieldType="double"
        mode="expression"
        headerActions={<HeaderProbe />}
      />
    );
    expect(JSON.parse(screen.getByTestId('probe').textContent ?? '')).toMatchObject({
      fieldType: 'double',
      isExpression: true,
      disabled: true,
      compact: true,
    });

    render(<HeaderProbe />);
    expect(screen.getAllByTestId('probe')[1]).toHaveTextContent('none');
  });
});

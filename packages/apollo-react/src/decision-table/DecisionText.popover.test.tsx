import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createElement, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DECISION_TEXT_EDIT_LABELS,
  DECISION_TEXT_LABELS,
  MULTI_SENTENCE_BANDS,
  MULTI_SENTENCE_HEADER,
  MULTI_SENTENCE_RULES,
} from './__fixtures__/sentences.fixtures';
import { CellTextEditor } from './CellTextEditor';
import { DecisionText } from './DecisionText';
import type { DecisionTextEdit } from './decisionTextTypes';
import type { SentenceSelection, SentenceValueId } from './sentenceTypes';
import type { SentenceEditorContext, ValueField, ValueOperatorOption } from './valueTypes';

vi.unmock('@uipath/apollo-wind/components/ui/tooltip');
afterEach(cleanup);

const OPS: ValueOperatorOption[] = [
  { id: '<', label: 'is less than' },
  { id: '>', label: 'is greater than' },
  { id: 'between', label: 'is between', shape: 'range' },
  { id: 'noneOf', label: 'is none of', shape: 'list' },
];
const at = (rowId: string, columnId: string, index = 0): SentenceValueId => ({
  rowId,
  columnId,
  index,
});

const Host = ({
  initial,
  valueField,
  renderEditor,
  onCommit,
}: {
  initial: SentenceValueId;
  valueField: DecisionTextEdit['valueField'];
  renderEditor?: DecisionTextEdit['renderEditor'];
  onCommit: DecisionTextEdit['onCommit'];
}) => {
  const [editing, setEditing] = useState<SentenceValueId | null>(initial);
  const [selected, setSelected] = useState<SentenceSelection | null>(null);
  return (
    <DecisionText
      rules={MULTI_SENTENCE_RULES}
      bands={MULTI_SENTENCE_BANDS}
      header={MULTI_SENTENCE_HEADER}
      labels={DECISION_TEXT_LABELS}
      ariaLabel="Rules"
      dataTestId="nl"
      selected={selected}
      onSelect={setSelected}
      edit={{
        editing,
        onStartEdit: setEditing,
        onCommit: (value, commit, move) => {
          onCommit(value, commit, move);
          setEditing(null);
        },
        onCancel: () => setEditing(null),
        onClearCell: () => {},
        conditionEntries: () => [],
        ruleEntries: () => [],
        onDeleteRule: () => {},
        labels: DECISION_TEXT_EDIT_LABELS,
        valueField,
        renderEditor,
      }}
    />
  );
};

const popover = () => within(screen.getByTestId('nl-value-editor'));
const pickOperator = (name: string) => {
  fireEvent.click(popover().getByRole('combobox', { name: 'Operator' }));
  fireEvent.click(screen.getByRole('option', { name }));
};
if (!customElements.get('popover-test-shadow')) {
  customElements.define(
    'popover-test-shadow',
    class extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: 'open' }).appendChild(document.createElement('input'));
      }
    }
  );
}
const hostEditor = (ctx: SentenceEditorContext) => (
  <div>
    {createElement('popover-test-shadow', { 'data-testid': 'shadow' })}
    <div contentEditable="plaintext-only" suppressContentEditableWarning data-testid="plain">
      600
    </div>
    <div role="slider" tabIndex={0} aria-label="Weight" aria-valuenow={1} data-testid="slider" />
    <a href="#help" data-testid="link">
      Help
    </a>
    <span data-testid="caption">FEEL</span>
    <select aria-label="Dialect" data-testid="dialect">
      <option>FEEL</option>
      <option>JS</option>
    </select>
    <CellTextEditor
      value={ctx.value}
      ariaLabel={ctx.ariaLabel}
      dataTestId="host-editor"
      onCommit={ctx.onCommit}
      onCancel={ctx.onCancel}
      onDraftChange={ctx.onDraftChange}
    />
  </div>
);

describe('DecisionText value popover settling', () => {
  it('applies the expression the editor shows, unedited, once the fields changed the operator', () => {
    const onCommit = vi.fn();
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ operators: OPS, operator: '<', expression: '< 600' })}
        renderEditor={hostEditor}
        onCommit={onCommit}
      />
    );
    pickOperator('is greater than');
    fireEvent.click(popover().getByRole('button', { name: 'Edit expression' }));
    const shown = (screen.getByTestId('host-editor') as HTMLInputElement).value;
    fireEvent.click(popover().getByRole('button', { name: 'Apply' }));
    expect(onCommit.mock.calls[0]?.[1]).toEqual({ kind: 'expression', text: shown });
  });

  it('applies the expression the editor shows, unedited, once the fields became a range', () => {
    const onCommit = vi.fn();
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ operators: OPS, operator: '<', expression: '< 600' })}
        renderEditor={hostEditor}
        onCommit={onCommit}
      />
    );
    pickOperator('is between');
    fireEvent.change(popover().getByRole('textbox', { name: 'From' }), {
      target: { value: '650' },
    });
    fireEvent.change(popover().getByRole('textbox', { name: 'To' }), { target: { value: '900' } });
    fireEvent.click(popover().getByRole('button', { name: 'Edit expression' }));
    const shown = (screen.getByTestId('host-editor') as HTMLInputElement).value;
    fireEvent.click(popover().getByRole('button', { name: 'Apply' }));
    expect(onCommit.mock.calls[0]?.[1]).toEqual({ kind: 'expression', text: shown });
  });

  it("leaves a press on any control in the host's editor its default", () => {
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ operators: OPS, operator: '<', expression: '< 600' })}
        renderEditor={hostEditor}
        onCommit={vi.fn()}
      />
    );
    fireEvent.click(popover().getByRole('button', { name: 'Edit expression' }));
    const shadowInput = screen.getByTestId('shadow').shadowRoot?.querySelector('input');
    if (!shadowInput) throw new Error('no shadow input');
    expect(
      [
        shadowInput,
        ...['dialect', 'plain', 'slider', 'link'].map((id) => screen.getByTestId(id)),
      ].map((control) => fireEvent.mouseDown(control))
    ).toEqual([true, true, true, true, true]);
  });

  it.each<[string, () => void]>([
    [
      'a list with every value unchecked',
      () => {
        fireEvent.click(popover().getByRole('checkbox', { name: '"RU"' }));
        fireEvent.click(popover().getByRole('checkbox', { name: '"KP"' }));
      },
    ],
    [
      'a range whose From is a space',
      () => {
        pickOperator('is between');
        fireEvent.change(popover().getByRole('textbox', { name: 'From' }), {
          target: { value: ' ' },
        });
      },
    ],
  ])('keeps Apply off with no radio checked once %s turns into a single value with allowed values', (_, before) => {
    const onCommit = vi.fn();
    const field = (): ValueField => ({
      operators: OPS,
      operator: 'noneOf',
      values: ['"RU"', '"KP"'],
      allowedValues: ['"CN"'],
    });
    render(<Host initial={at('m2', 'country')} valueField={field} onCommit={onCommit} />);
    before();
    pickOperator('is less than');
    const radios = popover().getAllByRole('radio');
    const checked = radios.filter((radio) => radio.getAttribute('aria-checked') === 'true');
    const apply = popover().getByRole('button', { name: 'Apply' });
    fireEvent.click(apply);
    expect(checked).toHaveLength(0);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it.each<[string, ValueField]>([
    ['its text field', { operators: OPS }],
    ['an allowed value', { operators: OPS, allowedValues: ['"CN"', '"US"'] }],
  ])('leaves Tab and Shift+Tab to the browser from %s of a condition that cannot apply yet', (_, field) => {
    render(<Host initial={at('m3', 'country')} valueField={() => field} onCommit={vi.fn()} />);
    const stop = field.allowedValues
      ? popover().getAllByRole('radio')[0]
      : screen.getByTestId('nl-editor');
    if (!stop) throw new Error('no field');
    expect([
      fireEvent.keyDown(stop, { key: 'Tab' }),
      fireEvent.keyDown(stop, { key: 'Tab', shiftKey: true }),
      fireEvent.keyDown(stop, { key: 'Enter' }),
    ]).toEqual([true, true, false]);
  });

  it("keeps focus in the popover on a press off the host editor's controls", () => {
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ operators: OPS, operator: '<', expression: '< 600' })}
        renderEditor={hostEditor}
        onCommit={vi.fn()}
      />
    );
    fireEvent.click(popover().getByRole('button', { name: 'Edit expression' }));
    expect(fireEvent.mouseDown(screen.getByTestId('caption'))).toBe(false);
  });

  it.each<[string, ValueField]>([
    ['an empty operator', { operators: OPS, operator: '' }],
    ['an operator with an empty id', { operators: [{ id: '', label: 'blank' }, ...OPS] }],
  ])('opens on %s without the empty one', (_, field) => {
    render(<Host initial={at('m3', 'score')} valueField={() => field} onCommit={vi.fn()} />);
    fireEvent.click(popover().getByRole('combobox', { name: 'Operator' }));
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(
      OPS.map((option) => option.label)
    );
  });

  it('offers each allowed value once, checking the held one', () => {
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ allowedValues: ['600', '600', '700'] })}
        onCommit={vi.fn()}
      />
    );
    const radios = popover().getAllByRole('radio');
    expect(radios.map((radio) => radio.getAttribute('aria-checked'))).toEqual(['true', 'false']);
  });
});

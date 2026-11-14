import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createElement, useEffect, useRef, useState } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { installEscapeCloseRequest } from './__fixtures__/modalDialog';
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
let uninstallEscape: () => void = () => {};
beforeAll(() => {
  uninstallEscape = installEscapeCloseRequest();
});
afterAll(() => uninstallEscape());

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

/** A host editor built on DOM listeners: Tab commits a move when it claims Tab, and blur commits in place. */
const DomEditor = ({
  ctx,
  claimTab,
  shadow,
}: {
  ctx: SentenceEditorContext;
  claimTab: boolean;
  shadow: boolean;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  useEffect(() => {
    const host = ref.current;
    if (!host || host.firstChild || host.shadowRoot) return;
    const parent = shadow ? host.attachShadow({ mode: 'open' }) : host;
    const input = document.createElement('input');
    input.setAttribute('data-testid', 'dom-editor');
    input.value = ctxRef.current.value;
    parent.append(input);
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab' || !claimTab) return;
      event.preventDefault();
      ctxRef.current.onCommit(input.value, event.shiftKey ? 'left' : 'right');
    });
    input.addEventListener('blur', () => ctxRef.current.onCommit(input.value, 'none'));
    input.focus();
  }, [claimTab, shadow]);
  return <div ref={ref} data-testid="dom-host" />;
};

const domInput = (): HTMLInputElement => {
  const host = screen.getByTestId('dom-host');
  const input = (host.shadowRoot ?? host).querySelector('input');
  if (!input) throw new Error('no host input');
  return input;
};

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

  it("leaves a press off the host editor's controls its default, keeping the popover open", () => {
    const onCommit = vi.fn();
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ operators: OPS, operator: '<', expression: '< 600' })}
        renderEditor={hostEditor}
        onCommit={onCommit}
      />
    );
    fireEvent.click(popover().getByRole('button', { name: 'Edit expression' }));
    expect(fireEvent.mouseDown(screen.getByTestId('caption'))).toBe(true);
    fireEvent.click(screen.getByTestId('caption'));
    expect(screen.getByTestId('nl-value-editor')).toBeInTheDocument();
    expect(onCommit).not.toHaveBeenCalled();
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

  it.each<[string, ValueField, boolean]>([
    ['a single value', { operators: OPS, operator: '<', expression: '< 600' }, false],
    ['a range', { operators: OPS, operator: 'between', values: ['600', '700'] }, false],
    ["the host's expression editor", { operators: OPS, operator: '<', expression: '< 600' }, true],
    ['an outcome with allowed values', { allowedValues: ['600', '700'] }, false],
  ])('opens the popover of %s as a modal dialog, leaving Tab and Shift+Tab to the browser', (_, field, expression) => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
    const onCommit = vi.fn();
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => field}
        renderEditor={hostEditor}
        onCommit={onCommit}
      />
    );
    if (expression) fireEvent.click(popover().getByRole('button', { name: 'Edit expression' }));
    const dialog = screen.getByTestId('nl-value-editor');
    expect(dialog.tagName).toBe('DIALOG');
    expect(showModal.mock.contexts).toEqual([dialog]);
    const apply = popover().getByRole('button', { name: 'Apply' });
    apply.focus();
    expect(fireEvent.keyDown(apply, { key: 'Tab' })).toBe(true);
    expect(fireEvent.keyDown(apply, { key: 'Tab', shiftKey: true })).toBe(true);
    expect(onCommit).not.toHaveBeenCalled();
    showModal.mockRestore();
  });

  it("moves focus on Tab and Shift+Tab from the host's editor that claims Tab, applying nothing", () => {
    const onCommit = vi.fn();
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ operators: OPS, operator: '<', expression: '< 600' })}
        renderEditor={hostEditor}
        onCommit={onCommit}
      />
    );
    fireEvent.click(popover().getByRole('button', { name: 'Edit expression' }));
    const input = screen.getByTestId('host-editor');
    input.focus();
    fireEvent.change(input, { target: { value: '> 1' } });
    const actions = popover().getAllByRole('button');
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(document.activeElement).toBe(actions[0]);
    input.focus();
    fireEvent.keyDown(input, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(actions.at(-1));
    expect(actions.at(-1)).toBe(popover().getByRole('button', { name: 'Apply' }));
    expect(onCommit).not.toHaveBeenCalled();
    fireEvent.click(popover().getByRole('button', { name: 'Apply' }));
    expect(onCommit.mock.calls[0]?.[1]).toEqual({ kind: 'expression', text: '> 1' });
  });

  it.each([
    false,
    true,
  ])('applies nothing when focus moves inside the popover from a host editor that commits on a DOM blur (shadow root: %s)', (shadow) => {
    const onCommit = vi.fn();
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ operators: OPS, operator: '<', expression: '< 600' })}
        renderEditor={(ctx) => <DomEditor ctx={ctx} claimTab={false} shadow={shadow} />}
        onCommit={onCommit}
      />
    );
    fireEvent.click(popover().getByRole('button', { name: 'Edit expression' }));
    domInput().focus();
    domInput().value = '> 1';
    popover().getByRole('button', { name: 'Cancel' }).focus();
    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByTestId('nl-value-editor')).toBeInTheDocument();
  });

  it.each<[string, string, boolean]>([
    ['Tab', 'Cancel', false],
    ['Shift+Tab', 'Apply', true],
  ])('moves %s from a shadow-root host editor that claims Tab to %s, wrapping', (_, name, shiftKey) => {
    const onCommit = vi.fn();
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ operators: OPS, operator: '<', expression: '< 600' })}
        renderEditor={(ctx) => <DomEditor ctx={ctx} claimTab shadow />}
        onCommit={onCommit}
      />
    );
    fireEvent.click(popover().getByRole('button', { name: 'Edit expression' }));
    domInput().focus();
    fireEvent.keyDown(domInput(), { key: 'Tab', shiftKey });
    expect(document.activeElement).toBe(popover().getByRole('button', { name }));
    expect(onCommit).not.toHaveBeenCalled();
  });
});

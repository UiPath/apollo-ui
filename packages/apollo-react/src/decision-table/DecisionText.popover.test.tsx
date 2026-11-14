import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { createElement, useEffect, useRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    const checked = radios.filter((radio) => radio instanceof HTMLInputElement && radio.checked);
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
    expect(radios.map((radio) => radio instanceof HTMLInputElement && radio.checked)).toEqual([
      true,
      false,
    ]);
  });

  const valueEditor = () => screen.getByTestId('nl-value-editor');
  const sentinels = () => {
    const [start, end] = valueEditor().querySelectorAll<HTMLElement>('[data-popover-sentinel]');
    if (!start || !end) throw new Error('no sentinels');
    return { start, end };
  };
  const button = (name: string) => popover().getByRole('button', { name });

  it.each<[string, ValueField, boolean]>([
    ['a single value', { operators: OPS, operator: '<', expression: '< 600' }, false],
    ['a range', { operators: OPS, operator: 'between', values: ['600', '700'] }, false],
    ["the host's expression editor", { operators: OPS, operator: '<', expression: '< 600' }, true],
  ])('puts sentinels around the controls of %s and sends Tab from Apply on from the first, leaving the move to the browser', (_, field, expression) => {
    const onCommit = vi.fn();
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => field}
        renderEditor={hostEditor}
        onCommit={onCommit}
      />
    );
    if (expression) fireEvent.click(button('Edit expression'));
    const { start, end } = sentinels();
    const controls = valueEditor().querySelectorAll('input, select, button, a, [tabindex]');
    expect([controls[0], controls[controls.length - 1]]).toEqual([start, end]);
    const apply = button('Apply');
    apply.focus();
    expect(fireEvent.keyDown(apply, { key: 'Tab' })).toBe(true);
    expect(document.activeElement).toBe(start);
    expect(onCommit).not.toHaveBeenCalled();
    expect(valueEditor()).toBeInTheDocument();
  });

  it.each<[string, ValueField, () => HTMLElement]>([
    [
      'the operator of a single value',
      { operators: OPS, operator: '<', expression: '< 600' },
      () => popover().getByRole('combobox', { name: 'Operator' }),
    ],
    [
      'the first radio of an outcome with allowed values',
      { allowedValues: ['600', '700'] },
      () => popover().getAllByRole('radio')[0] ?? document.body,
    ],
  ])('hands Shift+Tab from %s, which the browser takes to the start sentinel, to Apply, applying nothing', (_, field, first) => {
    const onCommit = vi.fn();
    render(<Host initial={at('m3', 'score')} valueField={() => field} onCommit={onCommit} />);
    first().focus();
    expect(fireEvent.keyDown(first(), { key: 'Tab', shiftKey: true })).toBe(true);
    sentinels().start.focus();
    expect(document.activeElement).toBe(button('Apply'));
    expect(onCommit).not.toHaveBeenCalled();
    expect(valueEditor()).toBeInTheDocument();
  });

  it('leaves Shift+Tab from Apply to the browser, and sends focus that reaches the start sentinel straight from Apply back to it', () => {
    const onCommit = vi.fn();
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ operators: OPS, operator: 'between', values: ['600', '700'] })}
        onCommit={onCommit}
      />
    );
    const apply = button('Apply');
    apply.focus();
    expect(fireEvent.keyDown(apply, { key: 'Tab', shiftKey: true })).toBe(true);
    expect(document.activeElement).toBe(apply);
    sentinels().start.focus();
    expect(document.activeElement).toBe(apply);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('keeps both sentinels out of sight', () => {
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ operators: OPS })}
        onCommit={vi.fn()}
      />
    );
    const { start, end } = sentinels();
    expect([start.className, end.className]).toEqual(['sr-only', 'sr-only']);
  });

  describe('a sentinel focus still holds a frame later', () => {
    let frames: Map<number, FrameRequestCallback>;
    beforeEach(() => {
      frames = new Map();
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
        frames.set(frames.size + 1, callback);
        return frames.size;
      });
      vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((frame) => {
        frames.delete(frame);
      });
    });
    afterEach(() => vi.restoreAllMocks());
    const nextFrame = () => {
      const pending = [...frames.values()];
      frames.clear();
      for (const callback of pending) callback(0);
    };
    const hopFromApply = () => {
      render(
        <Host
          initial={at('m3', 'score')}
          valueField={() => ({ operators: OPS, operator: 'between', values: ['600', '700'] })}
          onCommit={vi.fn()}
        />
      );
      const apply = button('Apply');
      apply.focus();
      fireEvent.keyDown(apply, { key: 'Tab', altKey: true });
      expect(document.activeElement).toBe(sentinels().start);
    };

    it('goes to the first action when the browser leaves it on the start sentinel', () => {
      hopFromApply();
      nextFrame();
      expect(document.activeElement).toBe(button('Cancel'));
    });

    it('stays where the browser moved it', () => {
      hopFromApply();
      const from = popover().getByRole('textbox', { name: 'From' });
      from.focus();
      nextFrame();
      expect(document.activeElement).toBe(from);
    });

    it('does nothing once the popover is gone', () => {
      hopFromApply();
      cleanup();
      const focus = vi.spyOn(HTMLElement.prototype, 'focus');
      expect(nextFrame).not.toThrow();
      expect(focus).not.toHaveBeenCalled();
    });
  });

  it('hands focus reaching the end sentinel, as Tab past a last field the browser stops on before the buttons does, to Apply', () => {
    const onCommit = vi.fn();
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ operators: OPS, operator: 'between', values: ['600', '700'] })}
        onCommit={onCommit}
      />
    );
    popover().getByRole('textbox', { name: 'To' }).focus();
    sentinels().end.focus();
    expect(document.activeElement).toBe(button('Apply'));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('wraps through Cancel while Apply is off', () => {
    render(
      <Host
        initial={at('m3', 'country')}
        valueField={() => ({ operators: OPS })}
        onCommit={vi.fn()}
      />
    );
    const cancel = button('Cancel');
    expect(button('Apply')).toBeDisabled();
    cancel.focus();
    expect(fireEvent.keyDown(cancel, { key: 'Tab' })).toBe(true);
    expect(document.activeElement).toBe(sentinels().start);
    screen.getByTestId('nl-editor').focus();
    sentinels().start.focus();
    expect(document.activeElement).toBe(cancel);
  });

  it.each([
    ['Control', { ctrlKey: true }],
    ['Meta', { metaKey: true }],
  ])('leaves %s+Tab from Apply to the browser', (_, modifier) => {
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ operators: OPS, operator: '<', expression: '< 600' })}
        onCommit={vi.fn()}
      />
    );
    const apply = button('Apply');
    apply.focus();
    expect(fireEvent.keyDown(apply, { key: 'Tab', ...modifier })).toBe(true);
    expect(document.activeElement).toBe(apply);
  });

  it.each([
    false,
    true,
  ])('keeps the text a host editor that commits on a DOM blur holds when Shift+Tab takes focus from it to the start sentinel (shadow root: %s)', (shadow) => {
    const onCommit = vi.fn();
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ operators: OPS, operator: '<', expression: '< 600' })}
        renderEditor={(ctx) => <DomEditor ctx={ctx} claimTab={false} shadow={shadow} />}
        onCommit={onCommit}
      />
    );
    fireEvent.click(button('Edit expression'));
    domInput().focus();
    domInput().value = '> 1';
    sentinels().start.focus();
    expect(document.activeElement).toBe(button('Apply'));
    expect(onCommit).not.toHaveBeenCalled();
    fireEvent.click(button('Apply'));
    expect(onCommit.mock.calls[0]?.[1]).toEqual({ kind: 'expression', text: '> 1' });
  });

  it.each<[string, boolean]>([
    ['Tab', false],
    ['Shift+Tab', true],
  ])('sends %s from a control with a positive tabindex, which the browser orders before the page, to Apply', (_, shiftKey) => {
    const onCommit = vi.fn();
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ operators: OPS, operator: '<', expression: '< 600' })}
        renderEditor={() => <input aria-label="First" tabIndex={1} data-testid="positive" />}
        onCommit={onCommit}
      />
    );
    fireEvent.click(button('Edit expression'));
    const positive = screen.getByTestId('positive');
    positive.focus();
    expect(fireEvent.keyDown(positive, { key: 'Tab', shiftKey })).toBe(false);
    expect(document.activeElement).toBe(button('Apply'));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('leaves Tab from Apply alone while an IME composes', () => {
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ operators: OPS, operator: '<', expression: '< 600' })}
        onCommit={vi.fn()}
      />
    );
    const apply = button('Apply');
    apply.focus();
    fireEvent.keyDown(apply, { key: 'Tab', keyCode: 229 });
    expect(document.activeElement).toBe(apply);
  });

  it('moves a Tab that a host editor control with a positive tabindex claims as its own', () => {
    const onCommit = vi.fn();
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ operators: OPS, operator: '<', expression: '< 600' })}
        renderEditor={(ctx) => (
          <input
            aria-label="First"
            tabIndex={1}
            data-testid="positive"
            onKeyDown={(event) => {
              event.preventDefault();
              ctx.onCommit(event.currentTarget.value, 'right');
            }}
          />
        )}
        onCommit={onCommit}
      />
    );
    fireEvent.click(button('Edit expression'));
    const positive = screen.getByTestId('positive');
    positive.focus();
    fireEvent.keyDown(positive, { key: 'Tab' });
    expect(document.activeElement).toBe(button('Cancel'));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it.each<[string, string, SentenceValueId, boolean]>([
    ['Tab', 'Cancel', at('m3', 'score'), false],
    ['Shift+Tab', 'Apply', at('m3', 'score'), true],
    ["an outcome's Tab", 'Clear', at('m1', 'decision'), false],
  ])("moves %s from the host's editor that claims it to %s, applying nothing", (_, name, initial, shiftKey) => {
    const onCommit = vi.fn();
    render(
      <Host
        initial={initial}
        valueField={() => ({ expression: '"x"' })}
        renderEditor={hostEditor}
        onCommit={onCommit}
      />
    );
    fireEvent.click(button('Edit expression'));
    const input = screen.getByTestId('host-editor');
    input.focus();
    fireEvent.change(input, { target: { value: '> 1' } });
    fireEvent.keyDown(input, { key: 'Tab', shiftKey });
    expect(document.activeElement).toBe(button(name));
    expect(onCommit).not.toHaveBeenCalled();
    fireEvent.click(button('Apply'));
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
    fireEvent.click(button('Edit expression'));
    domInput().focus();
    domInput().value = '> 1';
    button('Cancel').focus();
    expect(onCommit).not.toHaveBeenCalled();
    expect(valueEditor()).toBeInTheDocument();
  });

  it.each<[string, string, boolean]>([
    ['Tab', 'Cancel', false],
    ['Shift+Tab', 'Apply', true],
  ])('moves %s from a shadow-root host editor that claims Tab to %s', (_, name, shiftKey) => {
    const onCommit = vi.fn();
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ operators: OPS, operator: '<', expression: '< 600' })}
        renderEditor={(ctx) => <DomEditor ctx={ctx} claimTab shadow />}
        onCommit={onCommit}
      />
    );
    fireEvent.click(button('Edit expression'));
    domInput().focus();
    fireEvent.keyDown(domInput(), { key: 'Tab', shiftKey });
    expect(document.activeElement).toBe(button(name));
    expect(onCommit).not.toHaveBeenCalled();
  });
});

describe('DecisionText allowed values reached by Tab', () => {
  const radios = () => popover().getAllByRole('radio');
  const radio = (value: string) => {
    const found = radios().find((item) => item.getAttribute('value') === value);
    if (!found) throw new Error(`no radio ${value}`);
    return found;
  };
  const checkedValues = () =>
    radios()
      .filter((item) => item instanceof HTMLInputElement && item.checked)
      .map((item) => item.getAttribute('value'));
  const names = () => radios().map((item) => item.getAttribute('name'));

  it('lists the values as native radios in one group, named for this popover alone', () => {
    const { unmount } = render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ allowedValues: ['600', '700'] })}
        onCommit={vi.fn()}
      />
    );
    const [name] = names();
    expect(
      radios().every((item) => item instanceof HTMLInputElement && item.type === 'radio')
    ).toBe(true);
    expect(name).toBeTruthy();
    expect(new Set(names())).toEqual(new Set([name]));
    unmount();
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ allowedValues: ['600', '700'] })}
        onCommit={vi.fn()}
      />
    );
    expect(names()).not.toContain(name);
  });

  it.each<[string, () => void]>([
    [
      'a press between a radio and its label',
      () => {
        const row = radio('600').parentElement;
        if (!row) throw new Error('no radio row');
        fireEvent.mouseDown(row);
      },
    ],
    ['a press on the focused radio that ends off it', () => fireEvent.mouseDown(radio('600'))],
    ['a middle press on the focused radio', () => fireEvent.mouseDown(radio('600'), { button: 1 })],
    ['a right press on the focused radio', () => fireEvent.mouseDown(radio('600'), { button: 2 })],
  ])('keeps the held value checked and focused, applying nothing, after %s', (_, press) => {
    const onCommit = vi.fn();
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ allowedValues: ['600', '700'] })}
        onCommit={onCommit}
      />
    );
    press();
    fireEvent.mouseUp(document.body);
    expect(checkedValues()).toEqual(['600']);
    expect(document.activeElement).toBe(radio('600'));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('keeps the held value checked in one group once the host drops a value while open', () => {
    const field = (allowedValues: string[]) => () => ({ allowedValues });
    const { rerender } = render(
      <Host
        initial={at('m3', 'score')}
        valueField={field(['600', '800', '900'])}
        onCommit={vi.fn()}
      />
    );
    fireEvent.mouseDown(radio('800'));
    fireEvent.mouseUp(document.body);
    rerender(
      <Host initial={at('m3', 'score')} valueField={field(['600', '900'])} onCommit={vi.fn()} />
    );
    expect(checkedValues()).toEqual(['600']);
    expect(new Set(names()).size).toBe(1);
  });

  it('picks the focused radio once when a held Space comes up, leaving the popover closed', () => {
    const onCommit = vi.fn();
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ allowedValues: ['600', '700'] })}
        onCommit={onCommit}
      />
    );
    const held = radio('700');
    held.focus();
    expect(fireEvent.keyDown(held, { key: ' ' })).toBe(false);
    fireEvent.keyDown(held, { key: ' ', repeat: true });
    fireEvent.keyDown(held, { key: ' ', repeat: true });
    expect(onCommit).not.toHaveBeenCalled();
    fireEvent.keyUp(held, { key: ' ' });
    expect(onCommit.mock.calls.map((call) => call[1])).toEqual([
      { kind: 'values', values: ['700'], operator: undefined },
    ]);
    expect(screen.queryByTestId('nl-value-editor')).toBeNull();
  });

  it('picks nothing on a Space that comes up on a radio it did not go down on', () => {
    const onCommit = vi.fn();
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ allowedValues: ['600', '700'] })}
        onCommit={onCommit}
      />
    );
    fireEvent.keyDown(radio('600'), { key: ' ' });
    fireEvent.keyUp(radio('700'), { key: ' ' });
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('picks the value a mouse press lands on after an arrow moved the choice', async () => {
    const onCommit = vi.fn();
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ allowedValues: ['600', '700', '800'] })}
        onCommit={onCommit}
      />
    );
    const user = userEvent.setup();
    await user.keyboard('{ArrowDown}');
    expect(onCommit).not.toHaveBeenCalled();
    await user.click(screen.getByText('800', { selector: 'label' }));
    expect(onCommit.mock.calls.map((call) => call[1])).toEqual([
      { kind: 'values', values: ['800'], operator: undefined },
    ]);
  });

  it('names each radio by its value alone and keeps the inputs out of sight, with no axe violations', async () => {
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ allowedValues: ['700', '800'] })}
        onCommit={vi.fn()}
      />
    );
    expect(radios().map((item) => item.getAttribute('value'))).toEqual(['700', '800', '600']);
    expect(popover().getByRole('radio', { name: '600' })).toBe(radio('600'));
    expect(radios().every((item) => item.classList.contains('sr-only'))).toBe(true);
    expect(await axe(screen.getByTestId('nl-value-editor'))).toHaveNoViolations();
  });

  it('returns focus to the checked radio once the operator list closes', async () => {
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ operators: OPS, operator: '<', allowedValues: ['700', '600'] })}
        onCommit={vi.fn()}
      />
    );
    const user = userEvent.setup();
    act(() => radio('700').focus());
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(document.activeElement).toBe(radio('600'));
  });
});

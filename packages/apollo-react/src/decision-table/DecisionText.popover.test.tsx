import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Activity, createElement, StrictMode, useEffect, useRef, useState } from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { installEscapeCloseRequest } from './__fixtures__/modalDialog';
import {
  DECISION_TEXT_EDIT_LABELS,
  DECISION_TEXT_LABELS,
  MULTI_SENTENCE_BANDS,
  MULTI_SENTENCE_HEADER,
  MULTI_SENTENCE_RULES,
} from './__fixtures__/sentences.fixtures';
import { DecisionText } from './DecisionText';
import type { DecisionTextEdit } from './decisionTextTypes';
import type { SentenceSelection, SentenceValueId } from './sentenceTypes';
import type { ExpressionEditorProps, ValueField, ValueOperatorOption } from './valueTypes';

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
  refusesCancel = false,
}: {
  initial: SentenceValueId;
  valueField: DecisionTextEdit['valueField'];
  renderEditor?: DecisionTextEdit['renderEditor'];
  onCommit: DecisionTextEdit['onCommit'];
  refusesCancel?: boolean;
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
        onCancel: () => {
          if (!refusesCancel) setEditing(null);
        },
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
/** A host editor on the contract, in light DOM or its own shadow root: it reports its text, hands over its handle once mounted, or once `ready` runs when late, and records the keys that reach it, taking them while it owns keys. */
const ContractEditor = ({
  props,
  shadow = false,
  late = false,
  ownsKeys,
  keys = [],
}: {
  props: ExpressionEditorProps;
  shadow?: boolean;
  late?: boolean;
  ownsKeys?: () => boolean;
  keys?: string[];
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const latest = useRef(props);
  latest.current = props;
  useEffect(() => {
    const host = ref.current;
    if (!host || host.firstChild || host.shadowRoot) return;
    const parent = shadow ? host.attachShadow({ mode: 'open' }) : host;
    const input = document.createElement('input');
    input.setAttribute('data-testid', 'dom-editor');
    input.setAttribute('aria-label', latest.current.ariaLabel);
    input.value = latest.current.value;
    parent.append(input);
    input.addEventListener('input', () => latest.current.onChange(input.value));
    input.addEventListener('keydown', (event) => {
      keys.push(event.key);
      if (ownsKeys?.()) event.preventDefault();
    });
    const handle = { focus: () => input.focus(), ownsKeys };
    if (late) readyLater = () => act(() => latest.current.onReady(handle));
    else latest.current.onReady(handle);
  }, [shadow, late, ownsKeys, keys]);
  return <div ref={ref} data-testid="dom-host" />;
};
let readyLater = () => {};

const hostEditor = (props: ExpressionEditorProps) => (
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
    <ContractEditor props={props} />
  </div>
);

const domInput = (): HTMLInputElement => {
  const host = screen.getByTestId('dom-host');
  const input = (host.shadowRoot ?? host).querySelector('input');
  if (!input) throw new Error('no host input');
  return input;
};

const typeInto = (input: HTMLInputElement, text: string) => {
  input.value = text;
  fireEvent.input(input);
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
    const shown = domInput().value;
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
    const shown = domInput().value;
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
});

describe('DecisionText expression editor contract', () => {
  const field = () => ({ operators: OPS, operator: '<', expression: '< 600' });
  const open = (editor: DecisionTextEdit['renderEditor'], onCommit = vi.fn()) => {
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={field}
        renderEditor={editor}
        onCommit={onCommit}
      />
    );
    fireEvent.click(popover().getByRole('button', { name: 'Edit expression' }));
    return onCommit;
  };
  const activeIn = (input: HTMLInputElement) =>
    (input.getRootNode() as Document | ShadowRoot).activeElement === input;

  it('focuses an editor in its own shadow root on open', () => {
    open((props) => <ContractEditor props={props} shadow />);
    expect(activeIn(domInput())).toBe(true);
  });

  it('focuses the editor on open and applies its text on Enter, keeping the key from it', () => {
    const keys: string[] = [];
    const onCommit = open((props) => <ContractEditor props={props} keys={keys} />);
    expect(activeIn(domInput())).toBe(true);
    expect(domInput().value).toBe('< 600');
    typeInto(domInput(), '> 1');
    expect(fireEvent.keyDown(domInput(), { key: 'Enter' })).toBe(false);
    expect(onCommit.mock.calls).toEqual([
      [at('m3', 'score'), { kind: 'expression', text: '> 1' }, 'down'],
    ]);
    expect(keys).toEqual([]);
  });

  it('cancels on Escape from the editor, writing nothing', () => {
    const keys: string[] = [];
    const onCommit = open((props) => <ContractEditor props={props} keys={keys} />);
    typeInto(domInput(), '> 1');
    expect(fireEvent.keyDown(domInput(), { key: 'Escape' })).toBe(false);
    expect(screen.queryByTestId('nl-value-editor')).toBeNull();
    expect(onCommit).not.toHaveBeenCalled();
    expect(keys).toEqual([]);
  });

  it('leaves Tab and Shift+Tab from the editor to the browser, keeping them from the editor and applying nothing', () => {
    const keys: string[] = [];
    const onCommit = open((props) => <ContractEditor props={props} keys={keys} />);
    expect([
      fireEvent.keyDown(domInput(), { key: 'Tab' }),
      fireEvent.keyDown(domInput(), { key: 'Tab', shiftKey: true }),
    ]).toEqual([true, true]);
    expect(keys).toEqual([]);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('leaves Enter, Escape and Tab to an editor that owns them, but not Shift+Tab', () => {
    const keys: string[] = [];
    const onCommit = open((props) => (
      <ContractEditor props={props} keys={keys} ownsKeys={() => true} />
    ));
    for (const key of ['Enter', 'Escape', 'Tab']) fireEvent.keyDown(domInput(), { key });
    fireEvent.keyDown(domInput(), { key: 'Tab', shiftKey: true });
    expect(keys).toEqual(['Enter', 'Escape', 'Tab']);
    expect(screen.getByTestId('nl-value-editor')).toBeInTheDocument();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it.each([
    { isComposing: true },
    { keyCode: 229 },
  ])('applies nothing on an Enter while text composes (%o)', (composing) => {
    const onCommit = open((props) => <ContractEditor props={props} />);
    fireEvent.keyDown(domInput(), { key: 'Enter', ...composing });
    fireEvent.keyDown(domInput(), { key: 'Escape', ...composing });
    expect(screen.getByTestId('nl-value-editor')).toBeInTheDocument();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('holds focus on the frame while the editor is not ready, stays cancellable, and moves focus in once it is', () => {
    open((props) => <ContractEditor props={props} late />);
    const frame = document.activeElement;
    expect(frame).toBe(screen.getByTestId('dom-host').parentElement);
    expect(frame).toHaveAttribute('tabindex', '0');
    readyLater();
    expect(activeIn(domInput())).toBe(true);
    expect(frame).toHaveAttribute('tabindex', '-1');
  });

  it('cancels from Escape on the frame of an editor that is not ready', () => {
    const onCommit = open((props) => <ContractEditor props={props} late />);
    const frame = document.activeElement;
    if (!(frame instanceof HTMLElement)) throw new Error('no frame');
    fireEvent.keyDown(frame, { key: 'Escape' });
    expect(screen.queryByTestId('nl-value-editor')).toBeNull();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('leaves focus where it moved while the editor was not ready', () => {
    open((props) => <ContractEditor props={props} late />);
    const cancel = popover().getByRole('button', { name: 'Cancel' });
    cancel.focus();
    readyLater();
    expect(document.activeElement).toBe(cancel);
  });

  it('moves focus into an editor that replaced its focused input, and applies its text on Enter', () => {
    let remount = () => {};
    const Remounting = ({ props }: { props: ExpressionEditorProps }) => {
      const ref = useRef<HTMLDivElement | null>(null);
      const latest = useRef(props);
      latest.current = props;
      useEffect(() => {
        const host = ref.current;
        if (!host) return;
        const make = () => {
          const input = host.appendChild(document.createElement('input'));
          input.setAttribute('data-testid', 'dom-editor');
          input.value = latest.current.value;
          input.addEventListener('input', () => latest.current.onChange(input.value));
          latest.current.onReady({ focus: () => input.focus() });
          return input;
        };
        let input = make();
        remount = () =>
          act(() => {
            input.remove();
            latest.current.onReady(null);
            input = make();
          });
      }, []);
      return <div ref={ref} data-testid="dom-host" />;
    };
    const onCommit = open((props) => <Remounting props={props} />);
    typeInto(domInput(), '> 1');
    remount();
    expect(document.activeElement).toBe(domInput());
    fireEvent.keyDown(domInput(), { key: 'Enter' });
    expect(onCommit.mock.calls).toEqual([
      [at('m3', 'score'), { kind: 'expression', text: '> 1' }, 'down'],
    ]);
  });

  it('hands focus to the editor from a press around it', () => {
    open(hostEditor);
    popover().getByRole('button', { name: 'Cancel' }).focus();
    act(() => screen.getByTestId('dom-host').closest<HTMLElement>('[tabindex]')?.focus());
    expect(document.activeElement).toBe(domInput());
  });
});

describe('DecisionText value popover whose view stops rendering', () => {
  const observers = new Set<ResizeObserverCallback>();
  class FiringResizeObserver {
    readonly #callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.#callback = callback;
    }
    observe() {
      observers.add(this.#callback);
    }
    unobserve() {}
    disconnect() {
      observers.delete(this.#callback);
    }
  }
  const resizeAll = () =>
    act(() => {
      for (const callback of [...observers]) callback([], {} as ResizeObserver);
    });
  const field = () => ({ operators: OPS, operator: '<', expression: '< 600' });
  const dialog = () => document.querySelector('dialog');

  beforeEach(() => {
    observers.clear();
    vi.stubGlobal('ResizeObserver', FiringResizeObserver);
    const focusedBefore = new WeakMap<HTMLDialogElement, Element | null>();
    const showModal = HTMLDialogElement.prototype.showModal;
    vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(function (
      this: HTMLDialogElement
    ) {
      focusedBefore.set(this, document.activeElement);
      showModal.call(this);
      this.querySelector<HTMLElement>(
        ':is(button, input, select, textarea, [tabindex]):not(:disabled)'
      )?.focus();
    });
    vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(function (
      this: HTMLDialogElement
    ) {
      if (!this.open) return;
      this.removeAttribute('open');
      const before = focusedBefore.get(this);
      if (before instanceof HTMLElement && this.contains(document.activeElement)) before.focus();
      setTimeout(() => this.dispatchEvent(new Event('close')));
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
  const closeEvents = () => act(() => new Promise((resolve) => setTimeout(resolve)));

  it.each<[string, (frame: HTMLElement) => void]>([
    ['is display: none', (frame) => frame.style.setProperty('display', 'none')],
    ['is taken out of the document', (frame) => frame.remove()],
  ])('cancels the popover, writing nothing, once its frame %s', (_, hide) => {
    const onCommit = vi.fn();
    const { container } = render(
      <Host initial={at('m3', 'score')} valueField={field} onCommit={onCommit} />
    );
    expect(dialog()?.open).toBe(true);
    hide(container);
    resizeAll();
    expect(within(container).queryByTestId('nl-value-editor')).toBeNull();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('moves focus to the next rule once Enter applies the popover', async () => {
    const onCommit = vi.fn();
    const { container } = render(
      <Host initial={at('m3', 'score')} valueField={field} onCommit={onCommit} />
    );
    fireEvent.keyDown(popover().getByRole('textbox'), { key: 'Escape' });
    await closeEvents();
    const chip = container.querySelector<HTMLElement>(
      'li[data-row-id="m3"] [data-kind="value"][data-column-id="score"]'
    );
    if (!chip) throw new Error('no score value in m3');
    chip.focus();
    fireEvent.click(chip);
    const text = popover().getByRole('textbox');
    text.focus();
    fireEvent.keyDown(text, { key: 'Enter' });
    await closeEvents();
    expect(onCommit).toHaveBeenCalledWith(at('m3', 'score'), expect.anything(), 'down');
    expect(document.activeElement?.closest('li[data-row-id]')?.getAttribute('data-row-id')).toBe(
      'm4'
    );
  });

  it('closes the popover of a host that refuses the cancel while its frame is hidden, and opens it again on its first control once shown', async () => {
    const onCommit = vi.fn();
    const { container } = render(
      <Host initial={at('m3', 'score')} valueField={field} onCommit={onCommit} refusesCancel />
    );
    container.style.setProperty('display', 'none');
    resizeAll();
    await closeEvents();
    expect(dialog()?.open).toBe(false);
    container.style.removeProperty('display');
    resizeAll();
    expect(dialog()?.open).toBe(true);
    expect(document.activeElement).toBe(popover().getByRole('combobox', { name: 'Operator' }));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("keeps the popover open and focused through StrictMode's second run of its effects", async () => {
    render(
      <StrictMode>
        <Host initial={at('m3', 'score')} valueField={field} onCommit={vi.fn()} />
      </StrictMode>
    );
    await closeEvents();
    expect(dialog()?.open).toBe(true);
    expect(document.activeElement).toBe(popover().getByRole('textbox'));
  });

  it('opens and applies the popover in a browser without checkVisibility', async () => {
    const checkVisibility = Element.prototype.checkVisibility;
    Reflect.deleteProperty(Element.prototype, 'checkVisibility');
    try {
      const onCommit = vi.fn();
      render(<Host initial={at('m3', 'score')} valueField={field} onCommit={onCommit} />);
      resizeAll();
      expect(dialog()?.open).toBe(true);
      fireEvent.click(popover().getByRole('button', { name: 'Apply' }));
      await closeEvents();
      expect(onCommit).toHaveBeenCalledWith(at('m3', 'score'), expect.anything(), 'none');
    } finally {
      Element.prototype.checkVisibility = checkVisibility;
    }
  });

  it('closes the popover while an Activity hides its view, and opens it again on its first control once shown', async () => {
    const onCommit = vi.fn();
    const view = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <Host initial={at('m3', 'score')} valueField={field} onCommit={onCommit} />
      </Activity>
    );
    const { rerender } = render(view('visible'));
    expect(dialog()?.open).toBe(true);
    rerender(view('hidden'));
    await closeEvents();
    expect(dialog()?.open).toBe(false);
    rerender(view('visible'));
    expect(dialog()?.open).toBe(true);
    expect(document.activeElement).toBe(popover().getByRole('combobox', { name: 'Operator' }));
    expect(onCommit).not.toHaveBeenCalled();
  });
});

describe('DecisionText popover Shift+Tab at its start', () => {
  const field = { operators: OPS, operator: '<', expression: '< 600' };

  it.each<[string, ValueField, SentenceValueId]>([
    ['Apply', field, at('m3', 'score')],
    ['Cancel', { ...field, expression: '' }, at('m3', 'country')],
  ])('sends Shift+Tab from the first control to the last action, %s', async (name, valueField, value) => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Host initial={value} valueField={() => valueField} onCommit={onCommit} />);
    expect(popover().getByRole('button', { name: 'Apply' }).hasAttribute('disabled')).toBe(
      name === 'Cancel'
    );
    popover().getByRole('combobox', { name: 'Operator' }).focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(popover().getByRole('button', { name }));
    expect(onCommit).not.toHaveBeenCalled();
  });
});

describe('DecisionText popover Tab at its end', () => {
  const field = { operators: OPS, operator: '<', expression: '< 600' };

  it.each<[string, ValueField, SentenceValueId]>([
    ['Apply', field, at('m3', 'score')],
    ['Cancel', { ...field, expression: '' }, at('m3', 'country')],
  ])('sends Tab from the last action, %s, to the first control', async (name, valueField, value) => {
    const user = userEvent.setup({ delay: null });
    const onCommit = vi.fn();
    render(<Host initial={value} valueField={() => valueField} onCommit={onCommit} />);
    const action = popover().getByRole('button', { name });
    action.focus();
    expect(fireEvent.keyDown(action, { key: 'Tab' })).toBe(true);
    await user.tab();
    expect(document.activeElement).toBe(popover().getByRole('combobox', { name: 'Operator' }));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it.each([
    'altKey',
    'ctrlKey',
    'metaKey',
  ])('leaves Tab with %s on the last action to the browser', (modifier) => {
    render(<Host initial={at('m3', 'score')} valueField={() => field} onCommit={vi.fn()} />);
    const apply = popover().getByRole('button', { name: 'Apply' });
    apply.focus();
    fireEvent.keyDown(apply, { key: 'Tab', [modifier]: true });
    expect(document.activeElement).toBe(apply);
  });

  it('sends focus that reaches past the last control to the last action', () => {
    render(<Host initial={at('m3', 'score')} valueField={() => field} onCommit={vi.fn()} />);
    const end = screen.getByTestId('nl-value-editor').lastElementChild;
    if (!(end instanceof HTMLElement)) throw new Error('no end of the popover');
    end.focus();
    expect(document.activeElement).toBe(popover().getByRole('button', { name: 'Apply' }));
  });
});

describe('DecisionText popover Escape during composition', () => {
  it.each([
    { isComposing: true },
    { keyCode: 229 },
  ])('keeps the popover open on an Escape while text composes (%o), and cancels on the next', (composing) => {
    const onCommit = vi.fn();
    render(
      <Host
        initial={at('m3', 'score')}
        valueField={() => ({ operators: OPS, operator: '<', expression: '< 600' })}
        onCommit={onCommit}
      />
    );
    const text = popover().getByRole('textbox');
    fireEvent.keyDown(text, { key: 'Escape', ...composing });
    expect(screen.getByTestId('nl-value-editor')).toBeInTheDocument();
    fireEvent.keyDown(text, { key: 'Escape' });
    expect(screen.queryByTestId('nl-value-editor')).not.toBeInTheDocument();
    expect(onCommit).not.toHaveBeenCalled();
  });
});

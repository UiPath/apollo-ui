import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  EDITABLE_TABLE,
  tableColumns,
  wordedRules,
} from './__fixtures__/editableSentences.fixtures';
import { installEscapeCloseRequest } from './__fixtures__/modalDialog';
import { GRID_SENTENCE_POLICY } from './__fixtures__/sentences.fixtures';
import { type FixtureEdit, outcomeField, textPropsOf } from './__fixtures__/textMode';
import { DecisionText } from './DecisionText';
import type { SentenceValueId } from './sentenceTypes';

vi.unmock('@uipath/apollo-wind/components/ui/tooltip');
afterEach(cleanup);
let uninstallEscape: () => void = () => {};
beforeAll(() => {
  uninstallEscape = installEscapeCloseRequest();
});
afterAll(() => uninstallEscape());

const r3Age: SentenceValueId = { rowId: 'r3', columnId: 'age', index: 0 };

const editOf = (editing: SentenceValueId | null): FixtureEdit => ({
  editing,
  onStartEdit: () => {},
  onCancel: () => {},
  valueField: outcomeField,
  onCommit: () => undefined,
  onClearCell: () => undefined,
  onDeleteRule: () => {},
  wordRefusal: () => '',
});

const renderView = ({
  editing = null,
  readOnly = false,
}: {
  editing?: SentenceValueId | null;
  readOnly?: boolean;
} = {}) => {
  const onUndo = vi.fn();
  const onRedo = vi.fn();
  render(
    <DecisionText
      {...textPropsOf({
        rules: wordedRules(EDITABLE_TABLE),
        ...tableColumns(EDITABLE_TABLE),
        hitPolicy: GRID_SENTENCE_POLICY,
        ariaLabel: 'Rules',
        dataTestId: 'nl',
        ...(readOnly ? {} : { edit: editOf(editing), onUndo, onRedo }),
      })}
    />
  );
  return { onUndo, onRedo };
};

const view = () => screen.getByTestId('nl');

describe('DecisionText undo and redo', () => {
  it.each([
    ['Ctrl+Z', { key: 'z', ctrlKey: true }, 'undo'],
    ['Cmd+Z', { key: 'z', metaKey: true }, 'undo'],
    ['Ctrl+Shift+Z', { key: 'Z', ctrlKey: true, shiftKey: true }, 'redo'],
    ['Cmd+Shift+Z', { key: 'Z', metaKey: true, shiftKey: true }, 'redo'],
    ['Ctrl+Y', { key: 'y', ctrlKey: true }, 'redo'],
  ] as const)('%s on the view steps the host history once', (_name, keys, step) => {
    const { onUndo, onRedo } = renderView();
    const notCancelled = fireEvent.keyDown(view(), keys);
    expect(onUndo).toHaveBeenCalledTimes(step === 'undo' ? 1 : 0);
    expect(onRedo).toHaveBeenCalledTimes(step === 'redo' ? 1 : 0);
    expect(notCancelled).toBe(false);
  });

  it('takes the keys on a selected value inside the view', () => {
    const { onUndo } = renderView();
    const chip = view().querySelector<HTMLElement>('[data-kind="value"]');
    if (!chip) throw new Error('no value chip');
    fireEvent.keyDown(chip, { key: 'z', ctrlKey: true });
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['Ctrl+Alt+Z', { key: 'z', ctrlKey: true, altKey: true }],
    ['plain Z', { key: 'z' }],
  ] as const)('%s steps nothing', (_name, keys) => {
    const { onUndo, onRedo } = renderView();
    fireEvent.keyDown(view(), keys);
    expect(onUndo).not.toHaveBeenCalled();
    expect(onRedo).not.toHaveBeenCalled();
  });

  it('leaves the keys to a text field in the open value popover', () => {
    const { onUndo, onRedo } = renderView({ editing: r3Age });
    const field = screen.getByTestId('nl-value-editor').querySelector('input, textarea');
    if (!field) throw new Error('no text field in the popover');
    const notCancelled = fireEvent.keyDown(field, { key: 'z', ctrlKey: true });
    fireEvent.keyDown(field, { key: 'y', ctrlKey: true });
    expect(onUndo).not.toHaveBeenCalled();
    expect(onRedo).not.toHaveBeenCalled();
    expect(notCancelled).toBe(true);
  });

  it('leaves the keys to the open popover outside its text fields', () => {
    const { onUndo } = renderView({ editing: r3Age });
    fireEvent.keyDown(screen.getByTestId('nl-value-editor'), { key: 'z', ctrlKey: true });
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('leaves the keys to a text field the host renders inside the view', () => {
    const onUndo = vi.fn();
    render(
      <DecisionText
        {...textPropsOf({
          rules: wordedRules(EDITABLE_TABLE),
          ...tableColumns(EDITABLE_TABLE),
          hitPolicy: GRID_SENTENCE_POLICY,
          ariaLabel: 'Rules',
          dataTestId: 'nl',
          edit: editOf(null),
          onUndo,
          children: <input aria-label="Note" />,
        })}
      />
    );
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Note' }), { key: 'z', ctrlKey: true });
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('cancels nothing in a read view', () => {
    renderView({ readOnly: true });
    const notCancelled = fireEvent.keyDown(view(), { key: 'z', ctrlKey: true });
    expect(notCancelled).toBe(true);
  });

  it('claims a stepped key from the host container keydown', () => {
    const onKeyDown = vi.fn();
    const onUndo = vi.fn();
    render(
      <DecisionText
        {...textPropsOf({
          rules: wordedRules(EDITABLE_TABLE),
          ...tableColumns(EDITABLE_TABLE),
          hitPolicy: GRID_SENTENCE_POLICY,
          ariaLabel: 'Rules',
          dataTestId: 'nl',
          edit: editOf(null),
          onUndo,
          containerProps: { onKeyDown },
        })}
      />
    );
    fireEvent.keyDown(view(), { key: 'z', ctrlKey: true });
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onKeyDown).not.toHaveBeenCalled();
  });

  it('leaves a key a descendant already handled', () => {
    const onUndo = vi.fn();
    render(
      <DecisionText
        {...textPropsOf({
          rules: wordedRules(EDITABLE_TABLE),
          ...tableColumns(EDITABLE_TABLE),
          hitPolicy: GRID_SENTENCE_POLICY,
          ariaLabel: 'Rules',
          dataTestId: 'nl',
          edit: editOf(null),
          onUndo,
          children: (
            <span
              data-testid="handled"
              tabIndex={-1}
              onKeyDownCapture={(event) => event.preventDefault()}
            />
          ),
        })}
      />
    );
    fireEvent.keyDown(screen.getByTestId('handled'), { key: 'z', ctrlKey: true });
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('leaves a key pressed while composing', () => {
    const { onUndo } = renderView();
    fireEvent.keyDown(view(), { key: 'z', ctrlKey: true, isComposing: true });
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('takes the keys when the host renders the view inside its own dialog', () => {
    const host = document.body.appendChild(document.createElement('dialog'));
    host.setAttribute('open', '');
    const onUndo = vi.fn();
    render(
      <DecisionText
        {...textPropsOf({
          rules: wordedRules(EDITABLE_TABLE),
          ...tableColumns(EDITABLE_TABLE),
          hitPolicy: GRID_SENTENCE_POLICY,
          ariaLabel: 'Rules',
          dataTestId: 'nl',
          edit: editOf(null),
          onUndo,
        })}
      />,
      { container: host.appendChild(document.createElement('div')) }
    );
    const chip = view().querySelector<HTMLElement>('[data-kind="value"]');
    if (!chip) throw new Error('no value chip');
    fireEvent.keyDown(chip, { key: 'z', ctrlKey: true });
    expect(onUndo).toHaveBeenCalledTimes(1);
    host.remove();
  });

  it('takes the keys when the view sits in a shadow root inside the host dialog', () => {
    const host = document.body.appendChild(document.createElement('dialog'));
    host.setAttribute('open', '');
    const shadow = host.appendChild(document.createElement('div')).attachShadow({ mode: 'open' });
    const onUndo = vi.fn();
    render(
      <DecisionText
        {...textPropsOf({
          rules: wordedRules(EDITABLE_TABLE),
          ...tableColumns(EDITABLE_TABLE),
          hitPolicy: GRID_SENTENCE_POLICY,
          ariaLabel: 'Rules',
          dataTestId: 'nl',
          edit: editOf(null),
          onUndo,
        })}
      />,
      { container: shadow.appendChild(document.createElement('div')) }
    );
    const chip = shadow.querySelector<HTMLElement>('[data-testid="nl"] [data-kind="value"]');
    if (!chip) throw new Error('no value chip');
    fireEvent.keyDown(chip, { key: 'z', ctrlKey: true });
    expect(onUndo).toHaveBeenCalledTimes(1);
    host.remove();
  });
});

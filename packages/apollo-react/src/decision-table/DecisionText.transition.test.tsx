import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { startTransition, Suspense, use, useState } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { installEscapeCloseRequest, installModalInertness } from './__fixtures__/modalDialog';
import {
  COLUMN_TYPES,
  type FixtureOffer,
  HIT_POLICIES,
  MULTI_SENTENCE_COLUMNS,
  MULTI_SENTENCE_POLICY,
  MULTI_SENTENCE_RULES,
  offerOf,
  wordRefusal,
} from './__fixtures__/sentences.fixtures';
import type { FixtureEdit } from './__fixtures__/textMode';
import { DecisionText } from './DecisionText';
import type { SentenceValueId } from './sentenceTypes';

vi.unmock('@uipath/apollo-wind/components/ui/tooltip');
afterEach(cleanup);
let uninstallEscape: () => void = () => {};
let uninstallInertness: () => void = () => {};
beforeAll(() => {
  uninstallEscape = installEscapeCloseRequest();
  uninstallInertness = installModalInertness();
});
afterAll(() => {
  uninstallEscape();
  uninstallInertness();
});

const OPS: readonly FixtureOffer[] = [offerOf('<', 'single'), offerOf('>', 'single')];
const at = (rowId: string, columnId: string, index = 0): SentenceValueId => ({
  rowId,
  columnId,
  index,
});
const popover = () => within(screen.getByTestId('nl-value-editor'));
const never = new Promise<void>(() => {});
const Gate = ({ wait }: { wait: boolean }) => {
  if (wait) use(never);
  return null;
};

describe('DecisionText value popover across a suspended transition', () => {
  it.each([
    ['an outcome', 'decision', false],
    ['a condition with other offers', 'debt', false],
    ['nothing', 'decision', true],
  ])('commits the shown editor in its own offers after a suspended transition to %s', (_, other, skip) => {
    const onCommit = vi.fn();
    let openOther: () => void = () => {};
    const valueField: FixtureEdit['valueField'] = (cell) =>
      cell.columnId === 'debt'
        ? {
            kind: 'condition',
            allowedValues: [],
            expression: '< 1',
            operators: [offerOf('<', 'single'), offerOf('!=', 'single')],
            held: { shape: 'single', operator: '<', value: '1' },
          }
        : cell.columnId === 'score'
          ? {
              kind: 'condition',
              allowedValues: [],
              expression: '< 600',
              operators: OPS,
              held: { shape: 'single', operator: '<', value: '600' },
            }
          : { kind: 'outcome', allowedValues: [] };
    const SuspendingHost = () => {
      const [editing, setEditing] = useState<SentenceValueId | null>(at('m3', 'score'));
      openOther = () => startTransition(() => setEditing(at('m2', other)));
      return (
        <Suspense fallback={<p>loading</p>}>
          <DecisionText
            citations={{ kind: 'none' }}
            table={{
              rules: MULTI_SENTENCE_RULES,
              ...MULTI_SENTENCE_COLUMNS,
              hitPolicy: MULTI_SENTENCE_POLICY,
            }}
            hitPolicies={HIT_POLICIES}
            columnTypes={COLUMN_TYPES}
            ariaLabel="Rules"
            dataTestId="nl"
            mode={{
              kind: 'edit',
              selected: null,
              onSelect: () => {},
              onPolicyChange: () => {},
              onAddRule: () => {},
              onUndo: () => {},
              onRedo: () => {},
              edit: {
                editing,
                onStartEdit: setEditing,
                onCommit,
                onCancel: () => setEditing(null),
                onClearCell: () => {},
                onDeleteRule: () => {},
                valueField,
                wordRefusal,
              },
            }}
          />
          <Gate wait={editing?.rowId === 'm2'} />
        </Suspense>
      );
    };
    render(<SuspendingHost />);
    fireEvent.click(popover().getByRole('combobox', { name: 'Operator' }));
    fireEvent.click(screen.getByRole('option', { name: 'is greater than' }));
    if (!skip) act(() => openOther());
    expect(popover().getByRole('combobox', { name: 'Operator' })).toHaveTextContent(
      'is greater than'
    );
    fireEvent.click(popover().getByRole('button', { name: 'Apply' }));
    expect(onCommit.mock.calls).toEqual([
      [at('m3', 'score'), { kind: 'single', operator: '>', value: '600' }, 'none'],
    ]);
  });
});

describe('DecisionText value popover reopened after a value with no row', () => {
  it.each([
    [false],
    [true],
  ])('shows the host field of the second opening (host has onCancel: %s)', (withCancel) => {
    let drive: (editing: SentenceValueId | null, version?: number) => void = () => {};
    const Host = () => {
      const [state, setState] = useState<{ editing: SentenceValueId | null; version: number }>({
        editing: at('m3', 'score'),
        version: 0,
      });
      drive = (editing, version) => setState((s) => ({ editing, version: version ?? s.version }));
      const valueField: FixtureEdit['valueField'] = (cell) =>
        cell.columnId === 'score'
          ? {
              kind: 'condition',
              allowedValues: [],
              expression: state.version === 0 ? '< 600' : '> 700',
              operators: [offerOf('<', 'single'), offerOf('>', 'single')],
              held:
                state.version === 0
                  ? { shape: 'single', operator: '<', value: '600' }
                  : { shape: 'single', operator: '>', value: '700' },
            }
          : { kind: 'outcome', allowedValues: [] };
      return (
        <DecisionText
          citations={{ kind: 'none' }}
          table={{
            rules: MULTI_SENTENCE_RULES,
            ...MULTI_SENTENCE_COLUMNS,
            hitPolicy: MULTI_SENTENCE_POLICY,
          }}
          hitPolicies={HIT_POLICIES}
          columnTypes={COLUMN_TYPES}
          ariaLabel="Rules"
          dataTestId="nl"
          mode={{
            kind: 'edit',
            selected: null,
            onSelect: () => {},
            onPolicyChange: () => {},
            onAddRule: () => {},
            onUndo: () => {},
            onRedo: () => {},
            edit: {
              editing: state.editing,
              onStartEdit: (value) => drive(value),
              onCommit: () => {},
              onCancel: withCancel ? () => drive(null) : undefined,
              onClearCell: () => {},
              onDeleteRule: () => {},
              valueField,
              wordRefusal,
            },
          }}
        />
      );
    };
    render(<Host />);
    expect(popover().getByRole('combobox', { name: 'Operator' })).toHaveTextContent('is less than');
    act(() => drive(at('not-yet-added', 'score'), 1));
    act(() => drive(at('m3', 'score')));
    expect(popover().getByRole('combobox', { name: 'Operator' })).toHaveTextContent(
      'is greater than'
    );
    expect(popover().getByRole('textbox')).toHaveValue('700');
  });

  it('commits the second opening in the offers the host gives it', () => {
    const onCommit = vi.fn();
    let drive: (editing: SentenceValueId | null, version?: number) => void = () => {};
    const Host = () => {
      const [state, setState] = useState<{ editing: SentenceValueId | null; version: number }>({
        editing: at('m3', 'score'),
        version: 0,
      });
      drive = (editing, version) => setState((s) => ({ editing, version: version ?? s.version }));
      const valueField: FixtureEdit['valueField'] = (cell) =>
        cell.columnId === 'score'
          ? state.version === 0
            ? {
                kind: 'condition',
                allowedValues: [],
                expression: '< 600',
                operators: [offerOf('<', 'single'), offerOf('>', 'single')],
                held: { shape: 'single', operator: '<', value: '600' },
              }
            : {
                kind: 'condition',
                allowedValues: [],
                expression: '> 700',
                operators: [offerOf('>', 'single')],
                held: { shape: 'single', operator: '>', value: '700' },
              }
          : { kind: 'outcome', allowedValues: [] };
      return (
        <DecisionText
          citations={{ kind: 'none' }}
          table={{
            rules: MULTI_SENTENCE_RULES,
            ...MULTI_SENTENCE_COLUMNS,
            hitPolicy: MULTI_SENTENCE_POLICY,
          }}
          hitPolicies={HIT_POLICIES}
          columnTypes={COLUMN_TYPES}
          ariaLabel="Rules"
          dataTestId="nl"
          mode={{
            kind: 'edit',
            selected: null,
            onSelect: () => {},
            onPolicyChange: () => {},
            onAddRule: () => {},
            onUndo: () => {},
            onRedo: () => {},
            edit: {
              editing: state.editing,
              onStartEdit: (value) => drive(value),
              onCommit,
              onClearCell: () => {},
              onDeleteRule: () => {},
              valueField,
              wordRefusal,
            },
          }}
        />
      );
    };
    render(<Host />);
    act(() => drive(at('not-yet-added', 'score'), 1));
    act(() => drive(at('m3', 'score')));
    fireEvent.click(popover().getByRole('button', { name: 'Apply' }));
    expect(onCommit.mock.calls).toEqual([
      [at('m3', 'score'), { kind: 'single', operator: '>', value: '700' }, 'none'],
    ]);
  });
});

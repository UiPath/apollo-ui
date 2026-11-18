import { composeStories } from '@storybook/react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { vi } from 'vitest';
import { DecisionTable } from './DecisionTable';
import type { DecisionGraphNode } from './decisionGraphTypes';
import * as stories from './DecisionGraphText.stories';
import { EditableDecisionGraphText } from './EditableDecisionGraphText';

vi.unmock('@uipath/apollo-wind/components/ui/tooltip');

const { Default } = composeStories(stories);

beforeEach(() => {
  HTMLElement.prototype.scrollTo = () => {};
});

const at = () => document.activeElement?.getAttribute('data-testid') ?? null;

describe('focus when a focused rule in a graph body is deleted', () => {
  it('keeps focus on the neighbouring rule after the inline delete', async () => {
    render(<Default />);
    await userEvent.click(screen.getByTestId('graph-toggle-risk'));
    const body = within(screen.getByTestId('graph-body-risk'));
    await userEvent.click(screen.getByTestId('text-risk-row-r1'));
    await userEvent.click(body.getByRole('button', { name: 'Delete rule 1' }));
    expect(screen.queryByTestId('text-risk-row-r1')).toBeNull();
    expect(at()).toBe('text-risk-row-r2');
  });

  it.each([
    ['the body', false],
    ['the host', true],
  ] as const)('keeps focus in a DecisionTable body when %s removes its focused rule row', (_, lifted) => {
    const nodes: readonly DecisionGraphNode[] = [
      { kind: 'decision', id: 'a', label: 'A', logic: { kind: 'other' }, children: [] },
    ];
    let remove: (() => void) | null = null;
    const Table = ({ rows }: { rows: readonly string[] }) => (
      <DecisionTable
        columns={[{ id: 'c', name: 'C', defaultWidth: 100 }]}
        rowCount={rows.length}
        leadingColumnWidth={52}
        renderHeaderCell={(column) => <th key={column.id}>{column.name}</th>}
        renderRow={(rowIndex) => (
          <tr key={rows[rowIndex]}>
            <td>
              <button type="button" data-testid={`cell-${rows[rowIndex]}`} />
            </td>
          </tr>
        )}
        dataTestId="table"
        labels={{ resizeColumn: (name) => `Resize ${name}`, resetColumnWidth: 'Reset width' }}
      />
    );
    const Body = () => {
      const [rows, setRows] = useState(['r1', 'r2']);
      remove = () => setRows(['r2']);
      return <Table rows={rows} />;
    };
    const Host = () => {
      const [rows, setRows] = useState(['r1', 'r2']);
      if (lifted) remove = () => setRows(['r2']);
      return (
        <EditableDecisionGraphText
          nodes={nodes}
          mode={{ kind: 'edit', edit: { actions: [], wordRefusal: (r: string) => r } }}
          renderBody={() => (lifted ? <Table rows={rows} /> : <Body />)}
          dataTestId="graph"
        />
      );
    };
    render(<Host />);
    act(() => screen.getByTestId('graph-toggle-a').click());
    act(() => screen.getByTestId('graph-toggle-a').focus());
    act(() => screen.getByTestId('cell-r1').focus());
    expect(at()).toBe('cell-r1');
    act(() => remove?.());
    expect(at()).not.toBe('graph-toggle-a');
    expect(screen.getByTestId('table').contains(document.activeElement)).toBe(true);
  });
});

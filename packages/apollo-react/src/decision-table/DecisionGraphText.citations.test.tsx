import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { SHARED_DEPENDENCY } from './__fixtures__/decisionGraph.fixtures';
import { DecisionGraphText, type DecisionGraphTextProps } from './DecisionGraphText';
import type { SentenceCitation } from './sentenceTypes';

const CITATION: SentenceCitation = {
  kind: 'box',
  page: 4,
  box: { x: 1, y: 2, width: 3, height: 4 },
};

const firstId = () => SHARED_DEPENDENCY.nodes[0]?.id ?? '';

const graph = (props: Partial<DecisionGraphTextProps<never, never>> = {}) => (
  <DecisionGraphText
    nodes={SHARED_DEPENDENCY.nodes}
    renderBody={() => null}
    mode={{ kind: 'read', selected: null }}
    citations={{ kind: 'none' }}
    dataTestId="graph"
    {...props}
  />
);

describe('DecisionGraphText citations', () => {
  afterEach(cleanup);

  it('shows no citation without citations', () => {
    render(graph());
    expect(screen.queryAllByRole('button', { name: /Open source/ })).toHaveLength(0);
  });

  it('puts a cited decision citation on its heading, hidden at rest', () => {
    render(
      graph({
        citations: {
          kind: 'cited',
          decisions: new Map([[firstId(), [CITATION]]]),
          onOpenCitation: vi.fn(),
        },
      })
    );
    const button = within(screen.getByTestId(`graph-decision-${firstId()}`)).getByTestId(
      `graph-citation-${firstId()}`
    );
    expect(button.getAttribute('aria-label')).toBe('Open source, page 4');
    expect(button.className).toContain('opacity-0');
    expect(within(button).queryByText('Page 4')).toBeNull();
    expect(screen.getAllByRole('button', { name: /Open source/ })).toHaveLength(1);
  });

  it('shows the page once the decision is selected and opens it on click', async () => {
    const onOpenCitation = vi.fn();
    const onToggle = vi.fn();
    render(
      graph({
        mode: { kind: 'read', selected: firstId() },
        expansion: { expanded: new Set(), onChange: onToggle },
        citations: {
          kind: 'cited',
          decisions: new Map([[firstId(), [CITATION]]]),
          onOpenCitation,
        },
      })
    );
    const button = screen.getByTestId(`graph-citation-${firstId()}`);
    expect(within(button).getByText('Page 4')).toBeTruthy();
    await userEvent.click(button);
    expect(onOpenCitation).toHaveBeenCalledTimes(1);
    expect(onOpenCitation).toHaveBeenCalledWith(CITATION);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('leaves focus where the host moved it on Enter', async () => {
    const viewer = document.createElement('button');
    document.body.append(viewer);
    render(
      graph({
        mode: { kind: 'read', selected: firstId() },
        citations: {
          kind: 'cited',
          decisions: new Map([[firstId(), [CITATION]]]),
          onOpenCitation: () => viewer.focus(),
        },
      })
    );
    screen.getByTestId(`graph-citation-${firstId()}`).focus();
    await userEvent.keyboard('{Enter}');
    expect(document.activeElement).toBe(viewer);
    viewer.remove();
  });

  it('shows one button per citation of a decision', async () => {
    const onOpenCitation = vi.fn();
    const other: SentenceCitation = { kind: 'page', page: 9 };
    render(
      graph({
        citations: {
          kind: 'cited',
          decisions: new Map([[firstId(), [CITATION, other]]]),
          onOpenCitation,
        },
      })
    );
    const heading = within(screen.getByTestId(`graph-decision-${firstId()}`));
    expect(heading.getAllByRole('button', { name: /Open source/ })).toHaveLength(2);
    await userEvent.click(heading.getByRole('button', { name: 'Open source, page 9' }));
    expect(onOpenCitation).toHaveBeenCalledWith(other);
  });
});

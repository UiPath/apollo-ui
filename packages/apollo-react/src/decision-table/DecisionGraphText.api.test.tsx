import { render, screen } from '@testing-library/react';
import type React from 'react';
import { SHARED_DEPENDENCY } from './__fixtures__/decisionGraph.fixtures';
import { DecisionGraphText, type DecisionGraphTextProps } from './index';

const released: DecisionGraphTextProps = {
  nodes: SHARED_DEPENDENCY.nodes,
  renderBody: () => null,
  onFold: () => {},
  expansion: { expanded: new Set(['risk']), onChange: () => {} },
  selected: null,
  onReveal: () => {},
  onOpenDecision: () => {},
  rules: () => [],
  dataTestId: 'graph',
};

const ReleasedHost = (): React.ReactElement => (
  <DecisionGraphText
    nodes={released.nodes}
    renderBody={released.renderBody}
    onFold={released.onFold}
    expansion={released.expansion}
    selected={released.selected}
    onReveal={released.onReveal}
    onOpenDecision={released.onOpenDecision}
    rules={released.rules}
    dataTestId={released.dataTestId}
  />
);

describe('DecisionGraphText as released in 7.30.1', () => {
  it('reads the graph from the released props alone, with no decision actions', () => {
    render(<ReleasedHost />);
    expect(screen.getByTestId('graph-toggle-risk')).toBeInTheDocument();
    expect(screen.queryByTestId('graph-menu-risk')).toBeNull();
    expect(screen.queryByTestId('graph-add-decision')).toBeNull();
  });

  it('takes no mode', () => {
    render(
      <DecisionGraphText
        nodes={released.nodes}
        renderBody={released.renderBody}
        dataTestId="graph"
        // @ts-expect-error
        mode={{ kind: 'edit', edit: { actions: [], wordRefusal: String } }}
      />
    );
    expect(screen.queryByTestId('graph-menu-risk')).toBeNull();
  });
});

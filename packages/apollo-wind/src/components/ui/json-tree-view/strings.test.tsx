import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_JSON_TREE_VIEW_STRINGS,
  JsonTreeViewProvider,
  useJsonTreeViewStrings,
  useJsonTreeViewTooltipClassName,
} from './strings';

function Probe() {
  const strings = useJsonTreeViewStrings();
  const tooltipClassName = useJsonTreeViewTooltipClassName();
  return (
    <>
      <span data-testid="unset">{strings.unsetValue}</span>
      <span data-testid="expand">{strings.expandKey('name')}</span>
      <span data-testid="tooltip">{tooltipClassName ?? 'none'}</span>
    </>
  );
}

describe('JsonTreeViewProvider', () => {
  it('falls back to the English defaults', () => {
    render(<Probe />);
    expect(screen.getByTestId('unset')).toHaveTextContent(
      DEFAULT_JSON_TREE_VIEW_STRINGS.unsetValue
    );
    expect(screen.getByTestId('tooltip')).toHaveTextContent('none');
  });

  it('merges inner strings over outer ones key by key', () => {
    render(
      <JsonTreeViewProvider strings={{ unsetValue: 'outer', expandKey: (key) => `Open ${key}` }}>
        <JsonTreeViewProvider strings={{ unsetValue: 'inner' }}>
          <Probe />
        </JsonTreeViewProvider>
      </JsonTreeViewProvider>
    );
    expect(screen.getByTestId('unset')).toHaveTextContent('inner');
    expect(screen.getByTestId('expand')).toHaveTextContent('Open name');
  });

  it('keeps the inherited string when an override is undefined', () => {
    render(
      <JsonTreeViewProvider strings={{ expandKey: undefined }}>
        <Probe />
      </JsonTreeViewProvider>
    );
    expect(screen.getByTestId('expand')).toHaveTextContent('Expand name');
  });

  it('adds tooltip classes to the outer ones instead of replacing them', () => {
    render(
      <JsonTreeViewProvider tooltipContentClassName="z-1200">
        <JsonTreeViewProvider tooltipContentClassName="max-w-64">
          <Probe />
        </JsonTreeViewProvider>
      </JsonTreeViewProvider>
    );
    expect(screen.getByTestId('tooltip')).toHaveTextContent('z-1200 max-w-64');
  });
});

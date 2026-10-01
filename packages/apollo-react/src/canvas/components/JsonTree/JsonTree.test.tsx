import { buildJsonTree } from '@uipath/apollo-wind';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApI18nProvider } from '../../../i18n';
import { JsonLeafValueEditor, JsonTreeView, JsonTreeViewProvider } from './JsonTree';

// The tree's behavior is covered in apollo-wind; these cover only what the
// canvas wrapper adds: strings from the canvas catalog.
describe('JsonTreeView (canvas)', () => {
  // No `onEdit`: unset values still render (as "unset"), but nothing is editable.
  const nodes = buildJsonTree({
    schema: { type: 'object', properties: { name: { type: 'string' } } },
    value: {},
  });

  it('renders strings from the active canvas locale', () => {
    render(
      <ApI18nProvider component="canvas" locale="ja">
        <JsonTreeView nodes={nodes} />
      </ApI18nProvider>
    );
    expect(screen.getByText('未設定')).toBeInTheDocument();
  });

  it('falls back to English without an i18n provider', () => {
    render(<JsonTreeView nodes={nodes} />);
    expect(screen.getByText('unset')).toBeInTheDocument();
  });

  it('lets a strings prop override the translated strings', () => {
    render(
      <ApI18nProvider component="canvas" locale="ja">
        <JsonTreeView nodes={nodes} strings={{ unsetValue: 'empty' }} />
      </ApI18nProvider>
    );
    expect(screen.getByText('empty')).toBeInTheDocument();
  });

  it('keeps overrides from an outer canvas JsonTreeViewProvider', () => {
    render(
      <ApI18nProvider component="canvas" locale="ja">
        <JsonTreeViewProvider strings={{ unsetValue: 'outer' }}>
          <JsonTreeView nodes={nodes} />
        </JsonTreeViewProvider>
      </ApI18nProvider>
    );
    expect(screen.getByText('outer')).toBeInTheDocument();
  });

  it('lets the canvas provider override strings for the standalone editors', () => {
    const [node] = nodes;
    render(
      <JsonTreeViewProvider strings={{ editValueOf: (key) => `Change ${key}` }}>
        <JsonLeafValueEditor node={node} onCommit={() => {}} onCancel={() => {}} />
      </JsonTreeViewProvider>
    );
    expect(screen.getByRole('textbox', { name: 'Change name' })).toBeInTheDocument();
  });

  it('keeps the canvas translations under the overrides', () => {
    render(
      <ApI18nProvider component="canvas" locale="ja">
        <JsonTreeViewProvider strings={{ editValueOf: (key) => `Change ${key}` }}>
          <JsonTreeView nodes={nodes} />
        </JsonTreeViewProvider>
      </ApI18nProvider>
    );
    expect(screen.getByText('未設定')).toBeInTheDocument();
  });

  it('keeps an outer canvas provider override when an inner one overrides other keys', () => {
    render(
      <ApI18nProvider component="canvas" locale="ja">
        <JsonTreeViewProvider strings={{ unsetValue: 'outer' }}>
          <JsonTreeViewProvider strings={{ editValueOf: (key) => `Change ${key}` }}>
            <JsonTreeView nodes={nodes} />
          </JsonTreeViewProvider>
        </JsonTreeViewProvider>
      </ApI18nProvider>
    );
    expect(screen.getByText('outer')).toBeInTheDocument();
  });
});

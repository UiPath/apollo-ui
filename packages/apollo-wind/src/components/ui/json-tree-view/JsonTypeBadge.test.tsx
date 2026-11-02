import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { buildJsonTree } from './buildJsonTree';
import { JsonTreeView } from './JsonTree';
import { JsonTypeBadge } from './JsonTypeBadge';
import { JsonTreeViewProvider } from './strings';

describe('JsonTypeBadge reference', () => {
  it('labels the badge with the reference type and source', () => {
    render(
      <JsonTypeBadge
        type="string"
        reference={{ source: 'Live from Read customer · output.email' }}
      />
    );
    expect(
      screen.getByRole('img', {
        name: 'String · reference, Live from Read customer · output.email',
      })
    ).toBeTruthy();
  });

  it('falls back to the title alone without a source', () => {
    render(<JsonTypeBadge type="number" reference={{}} />);
    expect(screen.getByRole('img', { name: 'Number · reference' })).toBeTruthy();
  });

  it('renders no reference marker by default', () => {
    render(<JsonTypeBadge type="string" />);
    expect(screen.queryByRole('img', { name: /reference/ })).toBeNull();
  });

  it('marks only the rows decorateNode flags as references', () => {
    const nodes = buildJsonTree({ value: { to: 'ada@example.com', subject: 'Hi' } });
    render(
      <JsonTreeView
        nodes={nodes}
        collapsed={{}}
        readOnly
        decorateNode={(node) =>
          node.path === 'to' ? { badge: { reference: { source: 'output.email' } } } : undefined
        }
      />
    );
    expect(
      screen.getAllByRole('img', { name: /reference/ }).map((el) => el.getAttribute('aria-label'))
    ).toEqual(['String · reference, output.email']);
  });

  it('names a reference badge by its string tooltip', () => {
    render(<JsonTypeBadge type="string" tooltip="Customer email" reference={{ source: 'x' }} />);
    expect(screen.getByRole('img', { name: 'Customer email' })).toHaveAttribute('tabindex', '0');
  });

  it('opens the tooltip from keyboard focus', async () => {
    render(<JsonTypeBadge type="string" reference={{ source: 'output.email' }} />);
    await userEvent.tab();
    const badge = screen.getByRole('img', { name: 'String · reference, output.email' });
    expect(document.activeElement).toBe(badge);
    expect((await screen.findAllByText('output.email')).length).toBeGreaterThan(0);
  });

  it('falls back to the English title when a catalog omits referenceType', () => {
    render(
      <JsonTreeViewProvider strings={{ referenceType: undefined, requiredMarker: 'erforderlich' }}>
        <JsonTypeBadge type="string" reference={{}} />
      </JsonTreeViewProvider>
    );
    expect(screen.getByRole('img', { name: 'String · reference' })).toBeTruthy();
  });
});

describe('JsonTypeBadge type label', () => {
  it.each([
    [{}, 'Object'],
    [{ typeLabel: 'File' }, 'File'],
    [{ typeLabel: 'File', tooltip: 'Invoice PDF' }, 'Invoice PDF'],
  ])('shows the tooltip, else the type label, else the JSON type on hover', async (props, shown) => {
    const user = userEvent.setup();
    const { container } = render(<JsonTypeBadge type="object" {...props} />);
    await user.hover(container.firstElementChild as Element);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(shown);
  });

  it.each([
    [{}, 'Object'],
    [{ typeLabel: 'File' }, 'File'],
    [{ typeLabel: 'File', tooltip: 'Invoice PDF' }, 'Invoice PDF'],
    [{ typeLabel: 'File', tooltip: <b>Invoice PDF</b> }, 'File'],
  ])('names the badge for screen readers without making it a tab stop', (props, name) => {
    render(<JsonTypeBadge type="object" {...props} />);
    expect(screen.getByRole('img', { name })).not.toHaveAttribute('tabindex');
  });

  it('names a reference badge by its type label', () => {
    render(<JsonTypeBadge type="object" typeLabel="File" reference={{}} />);
    expect(screen.getByRole('img', { name: 'File · reference' })).toBeTruthy();
  });

  it('takes the label from deriveTypeLabel and the tooltip from the badge decoration in a tree', async () => {
    const user = userEvent.setup();
    const nodes = buildJsonTree({ value: { doc: { name: 'a.pdf' }, to: 'ada@example.com' } });
    render(
      <JsonTreeView
        nodes={nodes}
        collapsed={{}}
        readOnly
        deriveTypeLabel={(node) => (node.path === 'doc' ? 'File' : undefined)}
        decorateNode={(node) => ({
          badge: { reference: {}, tooltip: node.path === 'to' ? 'Customer email' : undefined },
        })}
      />
    );

    const badges = screen.getAllByRole('img');
    expect(badges.map((el) => el.getAttribute('aria-label'))).toEqual([
      'File · reference',
      'String · reference',
      'Customer email',
    ]);
    await user.hover(badges[2] as Element);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Customer email');
  });
});

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
    expect(screen.queryByRole('img')).toBeNull();
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

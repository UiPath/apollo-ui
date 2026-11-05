import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CollapsibleRowGroup } from './collapsible-row-group';

describe('CollapsibleRowGroup', () => {
  it('collapses its items, showing the detail only while collapsed', async () => {
    render(
      <CollapsibleRowGroup summary="2 conditions" detail="Name equals Ada">
        <span>Rows</span>
      </CollapsibleRowGroup>
    );
    const header = screen.getByRole('button', { name: '2 conditions' });
    expect(screen.getByText('Rows')).toBeInTheDocument();
    await userEvent.click(header);
    expect(screen.queryByText('Rows')).toBeNull();
    expect(header).toHaveTextContent('Name equals Ada');
    await userEvent.click(header);
    expect(screen.getByText('Rows')).toBeInTheDocument();
  });

  it('can start collapsed', () => {
    render(
      <CollapsibleRowGroup summary="1 condition" defaultOpen={false}>
        <span>Rows</span>
      </CollapsibleRowGroup>
    );
    expect(screen.queryByText('Rows')).toBeNull();
  });

  it('keeps its message in view while collapsed, and ties it to the header', () => {
    render(
      <CollapsibleRowGroup
        summary="1 condition"
        error="Some conditions are incomplete."
        defaultOpen={false}
      >
        <span>Rows</span>
      </CollapsibleRowGroup>
    );
    const message = screen.getByText('Some conditions are incomplete.');
    expect(screen.getByRole('button', { name: '1 condition' })).toHaveAttribute(
      'aria-describedby',
      message.id
    );
  });
});

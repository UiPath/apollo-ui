import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { JsonTreeToolbar } from './JsonTreeToolbar';

function Toolbar() {
  const [query, setQuery] = useState('');
  return <JsonTreeToolbar query={query} onQueryChange={setQuery} />;
}

describe('JsonTreeToolbar', () => {
  it('closes the search on Escape without letting it reach the host', async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(
      // A host that listens for Escape, like the canvas's deselect shortcut.
      // biome-ignore lint/a11y/noStaticElementInteractions: listens for keys that escape the toolbar.
      <div onKeyDown={onKeyDown}>
        <Toolbar />
      </div>
    );

    await user.click(screen.getByRole('button', { name: 'Search fields and values' }));
    const search = screen.getByRole('textbox');
    await user.type(search, 'abc');
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(onKeyDown).not.toHaveBeenCalledWith(expect.objectContaining({ key: 'Escape' }));
    // Other keys still reach the host.
    expect(onKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: 'a' }));
  });

  it('keeps the trailing slot after the controls, and when they are hidden', () => {
    const { rerender } = render(
      <JsonTreeToolbar
        query=""
        onQueryChange={() => {}}
        onToggleAll={() => {}}
        trailing={<span>Live</span>}
      />
    );
    const toolbar = screen.getByText('Live').parentElement!;
    expect(toolbar.lastElementChild).toBe(screen.getByText('Live'));
    expect(screen.getByRole('button', { name: 'Collapse all' })).toBeInTheDocument();

    rerender(
      <JsonTreeToolbar
        query=""
        onQueryChange={() => {}}
        controlsHidden
        trailing={<span>Live</span>}
      />
    );
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Search fields and values' })).toBeNull();
  });
});

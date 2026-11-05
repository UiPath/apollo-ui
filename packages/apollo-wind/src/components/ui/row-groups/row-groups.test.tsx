import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AddRowButton } from './add-row-button';
import { EmptyRows } from './empty-rows';
import { GroupModeToggle, MATCH_MODES, type MatchMode } from './group-mode-toggle';
import { RowDeleteButton } from './row-delete-button';
import { useRowFocus } from './use-row-focus';

describe('RowDeleteButton', () => {
  it('is named for its row and reports the click', async () => {
    const onClick = vi.fn();
    render(<RowDeleteButton label="Remove condition 2" onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Remove condition 2' });
    expect(button).toHaveAttribute('title', 'Remove condition 2');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('only hides itself until hover or focus when asked', () => {
    const { rerender } = render(<RowDeleteButton label="Remove" />);
    expect(screen.getByRole('button')).not.toHaveClass('opacity-0');
    rerender(<RowDeleteButton label="Remove" revealOnHover />);
    expect(screen.getByRole('button')).toHaveClass('opacity-0', 'group-hover:opacity-100');
  });
});

describe('AddRowButton', () => {
  it('takes a class name', () => {
    render(<AddRowButton className="ml-auto">Add condition</AddRowButton>);
    expect(screen.getByRole('button', { name: 'Add condition' })).toHaveClass('ml-auto');
  });

  it('names the item it adds and can be disabled', async () => {
    const onClick = vi.fn();
    const { rerender } = render(<AddRowButton onClick={onClick}>Add condition</AddRowButton>);
    await userEvent.click(screen.getByRole('button', { name: 'Add condition' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(
      <AddRowButton onClick={onClick} disabled>
        Add condition
      </AddRowButton>
    );
    expect(screen.getByRole('button', { name: 'Add condition' })).toBeDisabled();
  });
});

describe('EmptyRows', () => {
  it('says what happens with no items', () => {
    render(<EmptyRows>No conditions. The rule always applies.</EmptyRows>);
    expect(screen.getByText('No conditions. The rule always applies.')).toBeInTheDocument();
  });
});

describe('GroupModeToggle', () => {
  it('announces the selected mode and reports a change', async () => {
    const onValueChange = vi.fn();
    render(<GroupModeToggle modes={MATCH_MODES} value="all" onValueChange={onValueChange} />);
    expect(screen.getByRole('group', { name: 'Group mode' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'All (AND)' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: 'Any (OR)' }));
    expect(onValueChange).toHaveBeenCalledWith('any');
  });

  it('never reports an empty mode when the selected option is pressed again', async () => {
    const onValueChange = vi.fn();
    render(<GroupModeToggle modes={MATCH_MODES} value="all" onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'All (AND)' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("renders the consumer's modes, joining every segment to the next", async () => {
    const onValueChange = vi.fn();
    render(
      <GroupModeToggle
        modes={[
          { value: 'first', label: 'First match' },
          { value: 'every', label: 'Every match' },
          { value: 'none', label: 'No match' },
        ]}
        value="first"
        onValueChange={onValueChange}
      />
    );
    const [first, middle, last] = screen.getAllByRole('radio');
    expect(first).toHaveClass('rounded-r-none');
    expect(first).not.toHaveClass('rounded-l-none');
    expect(middle).toHaveClass('-ml-px', 'rounded-l-none', 'rounded-r-none');
    expect(last).toHaveClass('-ml-px', 'rounded-l-none');
    expect(last).not.toHaveClass('rounded-r-none');
    await userEvent.click(screen.getByRole('radio', { name: 'Every match' }));
    expect(onValueChange).toHaveBeenCalledWith('every');
  });

  it('takes an accessible name for the group', () => {
    render(
      <GroupModeToggle modes={MATCH_MODES} value="any" strings={{ label: 'Group 1 match mode' }} />
    );
    expect(screen.getByRole('group', { name: 'Group 1 match mode' })).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<GroupModeToggle modes={MATCH_MODES} value="all" disabled />);
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
  });
});

function List({ initial }: { initial: string[] }) {
  const [items, setItems] = useState(initial);
  const [mode, setMode] = useState<MatchMode>('all');
  const focus = useRowFocus();
  return (
    <>
      <GroupModeToggle modes={MATCH_MODES} value={mode} onValueChange={setMode} />
      <div ref={focus.listRef}>
        {items.map((item, position) => (
          <div key={item} data-row="">
            <button type="button">{`${item} options`}</button>
            <input aria-label={`${item} name`} data-row-first="" />
            <RowDeleteButton
              label={`Remove ${item}`}
              onClick={() => {
                focus.afterDelete(position);
                setItems((current) => current.filter((other) => other !== item));
              }}
            />
          </div>
        ))}
        {items.length === 0 && <EmptyRows>No items.</EmptyRows>}
      </div>
      <AddRowButton
        ref={focus.addRef}
        onClick={() => {
          focus.afterAdd();
          setItems((current) => [...current, `item ${current.length + 1}`]);
        }}
      >
        Add item
      </AddRowButton>
    </>
  );
}

describe('useRowFocus', () => {
  it("focuses the new item's first control after an add", async () => {
    render(<List initial={['item 1']} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add item' }));
    expect(screen.getByRole('textbox', { name: 'item 2 name' })).toHaveFocus();
  });

  it('falls back to the first button or input when no control is marked first', async () => {
    function Unmarked() {
      const [count, setCount] = useState(0);
      const focus = useRowFocus();
      return (
        <>
          <div ref={focus.listRef}>
            {Array.from({ length: count }, (_, index) => (
              <div key={index} data-row="">
                <input aria-label={`Row ${index + 1}`} />
              </div>
            ))}
          </div>
          <AddRowButton
            onClick={() => {
              focus.afterAdd();
              setCount((current) => current + 1);
            }}
          >
            Add row
          </AddRowButton>
        </>
      );
    }
    render(<Unmarked />);
    await userEvent.click(screen.getByRole('button', { name: 'Add row' }));
    expect(screen.getByRole('textbox', { name: 'Row 1' })).toHaveFocus();
  });

  it('focuses the delete action now at the same position, or the last one', async () => {
    render(<List initial={['a', 'b', 'c']} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove b' }));
    expect(screen.getByRole('button', { name: 'Remove c' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Remove c' }));
    expect(screen.getByRole('button', { name: 'Remove a' })).toHaveFocus();
  });

  it('focuses the add action once the list is empty', async () => {
    render(<List initial={['a']} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove a' }));
    expect(screen.getByText('No items.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add item' })).toHaveFocus();
  });

  it('leaves focus where it is when the host rejects the change', async () => {
    function Capped() {
      const [rows, setRows] = useState(['a']);
      const [name, setName] = useState('');
      const focus = useRowFocus();
      return (
        <>
          <div ref={focus.listRef}>
            {rows.map((row) => (
              <div key={row} data-row="">
                <input aria-label={`${row} name`} data-row-first="" />
              </div>
            ))}
          </div>
          <input
            aria-label="Title"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <AddRowButton
            ref={focus.addRef}
            onClick={() => {
              focus.afterAdd();
              // At the cap: the host keeps its rows as they are.
              setRows((current) => current);
            }}
          >
            Add row
          </AddRowButton>
          {/* Re-renders on every keystroke, which is when a stale move would fire. */}
          <span>{name}</span>
        </>
      );
    }
    render(<Capped />);
    await userEvent.click(screen.getByRole('button', { name: 'Add row' }));
    await userEvent.click(screen.getByRole('textbox', { name: 'Title' }));
    await userEvent.keyboard('ab');
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveFocus();
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('ab');
  });

  it('keeps the same callbacks across renders, so memoised rows stay memoised', () => {
    const seen: unknown[] = [];
    function Probe({ tick }: { tick: number }) {
      const focus = useRowFocus();
      seen.push(focus.afterAdd, focus.afterDelete);
      return <span>{tick}</span>;
    }
    const { rerender } = render(<Probe tick={1} />);
    rerender(<Probe tick={2} />);
    expect(seen[0]).toBe(seen[2]);
    expect(seen[1]).toBe(seen[3]);
  });

  it('leaves focus alone on renders it was not told about', async () => {
    render(<List initial={['a']} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Any (OR)' }));
    expect(screen.getByRole('radio', { name: 'Any (OR)' })).toHaveFocus();
  });
});

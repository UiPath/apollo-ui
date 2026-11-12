import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DataTable, DataTableColumnHeader, DataTableSelectColumn } from './data-table';

interface TestData {
  id: string;
  name: string;
  email: string;
}

const mockData: TestData[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  { id: '3', name: 'Bob Wilson', email: 'bob@example.com' },
];

const columns: ColumnDef<TestData>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
];

const sortableColumns: ColumnDef<TestData>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
  },
];

describe('DataTable', () => {
  describe('rendering', () => {
    it('renders table with data', () => {
      render(<DataTable columns={columns} data={mockData} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      render(<DataTable columns={columns} data={mockData} />);
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('renders empty state when no data', () => {
      render(<DataTable columns={columns} data={[]} />);
      expect(screen.getByText('No results.')).toBeInTheDocument();
    });

    it('renders pagination controls', () => {
      render(<DataTable columns={columns} data={mockData} />);
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('renders column toggle dropdown', () => {
      render(<DataTable columns={columns} data={mockData} />);
      expect(screen.getByRole('button', { name: /columns/i })).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<DataTable columns={columns} data={mockData} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no violations with search', async () => {
      const { container } = render(
        <DataTable columns={columns} data={mockData} searchKey="name" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('search functionality', () => {
    it('renders search input when searchKey provided', () => {
      render(<DataTable columns={columns} data={mockData} searchKey="name" />);
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('uses custom search placeholder', () => {
      render(
        <DataTable
          columns={columns}
          data={mockData}
          searchKey="name"
          searchPlaceholder="Search names..."
        />
      );
      expect(screen.getByPlaceholderText('Search names...')).toBeInTheDocument();
    });

    it('filters data when searching', async () => {
      const user = userEvent.setup();
      render(<DataTable columns={columns} data={mockData} searchKey="name" />);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('does not render search when searchKey not provided', () => {
      render(<DataTable columns={columns} data={mockData} />);
      expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
    });
  });

  describe('pagination', () => {
    it('shows row selection count when the table has a select column', () => {
      const withSelect = [DataTableSelectColumn<TestData>(), ...columns];
      render(<DataTable columns={withSelect} data={mockData} />);
      expect(screen.getByText(/0 of 3 row\(s\) selected/)).toBeInTheDocument();
    });

    it('hides the selection count when nothing can be selected', () => {
      render(<DataTable columns={columns} data={mockData} />);
      expect(screen.queryByText(/row\(s\) selected/)).not.toBeInTheDocument();
    });

    it('showSelectionCount overrides the default either way', () => {
      const { rerender } = render(
        <DataTable columns={columns} data={mockData} showSelectionCount />
      );
      expect(screen.getByText(/0 of 3 row\(s\) selected/)).toBeInTheDocument();
      const withSelect = [DataTableSelectColumn<TestData>(), ...columns];
      rerender(<DataTable columns={withSelect} data={mockData} showSelectionCount={false} />);
      expect(screen.queryByText(/row\(s\) selected/)).not.toBeInTheDocument();
    });

    it('shows page info', () => {
      render(<DataTable columns={columns} data={mockData} />);
      expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument();
    });

    it('disables previous button on first page', () => {
      render(<DataTable columns={columns} data={mockData} />);
      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    });

    it('hides pagination when showPagination is false', () => {
      render(<DataTable columns={columns} data={mockData} showPagination={false} />);
      expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
    });

    it('respects pageSize prop', () => {
      const largeData = Array.from({ length: 25 }, (_, i) => ({
        id: String(i),
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));
      render(<DataTable columns={columns} data={largeData} pageSize={5} />);
      expect(screen.getByText(/Page 1 of 5/)).toBeInTheDocument();
    });
  });

  describe('column toggle', () => {
    it('toggles column visibility', async () => {
      const user = userEvent.setup();
      render(<DataTable columns={columns} data={mockData} />);

      await user.click(screen.getByRole('button', { name: /columns/i }));

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Columns are listed by their header text
      expect(screen.getByRole('menuitemcheckbox', { name: 'Name' })).toBeInTheDocument();
      expect(screen.getByRole('menuitemcheckbox', { name: 'Email' })).toBeInTheDocument();
    });

    it('hides column toggle when showColumnToggle is false', () => {
      render(<DataTable columns={columns} data={mockData} showColumnToggle={false} />);
      expect(screen.queryByRole('button', { name: /columns/i })).not.toBeInTheDocument();
    });
  });
});

describe('DataTableColumnHeader', () => {
  it('renders sortable header', () => {
    const mockColumn = {
      toggleSorting: vi.fn(),
      getIsSorted: () => false,
      getCanSort: () => true,
      getCanMultiSort: () => true,
    };

    render(<DataTableColumnHeader column={mockColumn as never} title="Name" />);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('calls toggleSorting on click', async () => {
    const user = userEvent.setup();
    const mockColumn = {
      toggleSorting: vi.fn(),
      getIsSorted: () => false,
      getCanSort: () => true,
      getCanMultiSort: () => true,
    };

    render(<DataTableColumnHeader column={mockColumn as never} title="Name" />);

    await user.click(screen.getByRole('button'));
    expect(mockColumn.toggleSorting).toHaveBeenCalled();
  });
});

describe('DataTableSelectColumn', () => {
  it('creates select column definition', () => {
    const selectColumn = DataTableSelectColumn<TestData>();
    expect(selectColumn.id).toBe('select');
    expect(selectColumn.enableSorting).toBe(false);
    expect(selectColumn.enableHiding).toBe(false);
  });

  it('renders select all checkbox in header', () => {
    const columnsWithSelect = [DataTableSelectColumn<TestData>(), ...columns];
    render(<DataTable columns={columnsWithSelect} data={mockData} />);
    expect(screen.getByLabelText('Select all')).toBeInTheDocument();
  });

  it('renders row checkboxes', () => {
    const columnsWithSelect = [DataTableSelectColumn<TestData>(), ...columns];
    render(<DataTable columns={columnsWithSelect} data={mockData} />);
    expect(screen.getAllByLabelText(/^Select row \d+$/)).toHaveLength(3);
  });
});

describe('DataTable globalFilterFn', () => {
  it('renders search input and filters across multiple fields', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={mockData}
        globalFilterFn={(row, q) =>
          row.name.toLowerCase().includes(q.toLowerCase()) ||
          row.email.toLowerCase().includes(q.toLowerCase())
        }
        searchPlaceholder="Search all..."
      />
    );

    const input = screen.getByPlaceholderText('Search all...');
    // Match by name only
    await user.type(input, 'jane');
    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Clear and match by email substring
    await user.clear(input);
    await user.type(input, 'bob@');
    await waitFor(() => {
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('takes precedence over searchKey when both are provided', () => {
    render(
      <DataTable
        columns={columns}
        data={mockData}
        searchKey="name"
        globalFilterFn={() => true}
        searchPlaceholder="Global search"
      />
    );
    expect(screen.getByPlaceholderText('Global search')).toBeInTheDocument();
  });

  it('has no accessibility violations with globalFilterFn', async () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={mockData}
        globalFilterFn={(row, q) => row.name.toLowerCase().includes(q.toLowerCase())}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('DataTable allowWrap', () => {
  it('drops the truncate class from body cells when enabled', () => {
    render(<DataTable columns={columns} data={mockData} allowWrap />);
    const cell = screen.getByText('John Doe').closest('td');
    expect(cell).not.toBeNull();
    expect(cell).not.toHaveClass('truncate');
  });

  it('keeps truncate on body cells by default', () => {
    render(<DataTable columns={columns} data={mockData} />);
    const cell = screen.getByText('John Doe').closest('td');
    expect(cell).toHaveClass('truncate');
  });

  it('has no accessibility violations with allowWrap enabled', async () => {
    const { container } = render(<DataTable columns={columns} data={mockData} allowWrap />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('DataTable controlled state', () => {
  it('invokes onSortingChange when a sortable header is clicked', async () => {
    const user = userEvent.setup();
    const onSortingChange = vi.fn();
    render(
      <DataTable
        columns={sortableColumns}
        data={mockData}
        sorting={[]}
        onSortingChange={onSortingChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /name/i }));
    expect(onSortingChange).toHaveBeenCalled();
  });

  it('forwards a TanStack updater function to onSortingChange (OnChangeFn contract)', async () => {
    const user = userEvent.setup();
    const onSortingChange = vi.fn();
    render(
      <DataTable
        columns={sortableColumns}
        data={mockData}
        sorting={[]}
        onSortingChange={onSortingChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /name/i }));

    // Cursor's refactor forwards the updater verbatim instead of resolving to a value.
    // Asserting we received a function (not an array) locks in that contract.
    expect(onSortingChange).toHaveBeenCalledWith(expect.any(Function));

    const updater = onSortingChange.mock.calls[0][0] as (prev: unknown) => unknown;
    expect(updater([])).toEqual([{ id: 'name', desc: false }]);
  });

  it('applies initialSorting when sorting is uncontrolled', () => {
    render(
      <DataTable
        columns={columns}
        data={mockData}
        initialSorting={[{ id: 'name', desc: false }]}
        showPagination={false}
      />
    );

    // Alphabetical: Bob Wilson, Jane Smith, John Doe
    const [, firstRow, secondRow, thirdRow] = screen.getAllByRole('row');
    expect(firstRow).toHaveTextContent('Bob Wilson');
    expect(secondRow).toHaveTextContent('Jane Smith');
    expect(thirdRow).toHaveTextContent('John Doe');
  });

  it('runs in controlled mode for columnVisibility', () => {
    const onColumnVisibilityChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={mockData}
        columnVisibility={{ email: false }}
        onColumnVisibilityChange={onColumnVisibilityChange}
      />
    );
    // With email hidden, the column header should not render
    expect(screen.queryByText('Email')).not.toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('applies controlled columnSizing to the matching column header', () => {
    render(<DataTable columns={columns} data={mockData} resizable columnSizing={{ name: 200 }} />);

    const nameHeader = screen.getByText('Name').closest('th');
    expect(nameHeader).toHaveStyle({ width: '200px' });
  });

  it('has no accessibility violations with controlled state', async () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={mockData}
        sorting={[{ id: 'name', desc: false }]}
        onSortingChange={vi.fn()}
        columnVisibility={{}}
        onColumnVisibilityChange={vi.fn()}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ---------------------------------------------------------------------------
// Behaviour across features. Each case below reproduced a defect before it was fixed.
// ---------------------------------------------------------------------------

interface Person {
  id: string;
  name: string;
  email: string;
  age: number;
  joined?: string;
  active?: boolean;
  role?: string;
}

const people = (n: number): Person[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    name: `User ${String(i).padStart(2, '0')}`,
    email: `user${i}@example.com`,
    age: 20 + i,
    joined: '2026-01-15',
    active: i % 2 === 0,
    role: 'admin',
  }));

const personCols: ColumnDef<Person, unknown>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
];

const bodyRows = () => screen.getAllByRole('row').slice(1);

describe('pagination', () => {
  it('showPagination=false renders ALL rows (no hidden paging)', () => {
    render(<DataTable columns={personCols} data={people(25)} showPagination={false} />);
    expect(bodyRows()).toHaveLength(25);
  });

  it('pageSize prop change is respected after mount', () => {
    const { rerender } = render(<DataTable columns={personCols} data={people(25)} pageSize={10} />);
    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
    rerender(<DataTable columns={personCols} data={people(25)} pageSize={5} />);
    expect(screen.getByText(/Page 1 of 5/)).toBeInTheDocument();
  });

  it('empty data does not read "Page 1 of 0"', () => {
    render(<DataTable columns={personCols} data={[]} />);
    expect(screen.queryByText(/Page 1 of 0/)).not.toBeInTheDocument();
  });

  it('next/previous navigate and disable at the ends', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={personCols} data={people(25)} />);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(/Page 3 of 3/)).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('filtering while on page 3 lands on a valid page', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={personCols} data={people(25)} searchKey="name" />);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.type(screen.getByPlaceholderText('Search...'), 'User 0');
    expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(10);
  });

  it('editing a cell on page 2 keeps the user on page 2', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [data, setData] = React.useState(() => people(25));
      const columns = React.useMemo<ColumnDef<Person, unknown>[]>(
        () => [{ accessorKey: 'name', header: 'Name', meta: { type: 'text' } }],
        []
      );
      const onCellUpdate = React.useCallback(
        (rowIndex: number, columnId: string, value: unknown) => {
          setData((d) => d.map((r, i) => (i === rowIndex ? { ...r, [columnId]: value } : r)));
        },
        []
      );
      return <DataTable columns={columns} data={data} editable onCellUpdate={onCellUpdate} />;
    }
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
    await user.click(screen.getByText('User 12'));
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'Renamed{Enter}');
    expect(screen.getByText('Renamed')).toBeInTheDocument();
    expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
  });
});

describe('selection', () => {
  const selCols = [DataTableSelectColumn<Person>(), ...personCols] as ColumnDef<Person, unknown>[];

  it('with getRowId, selection follows the row, not the index, when data changes', async () => {
    const user = userEvent.setup();
    let remove!: () => void;
    function Harness() {
      const [data, setData] = React.useState(() => people(3));
      remove = () => setData((d) => d.slice(1));
      return <DataTable columns={selCols} data={data} getRowId={(row) => row.id} />;
    }
    render(<Harness />);
    await user.click(screen.getAllByLabelText(/^Select row \d+$/)[0]); // User 00
    expect(screen.getByText(/1 of 3 row\(s\) selected/)).toBeInTheDocument();
    act(() => remove()); // User 00 deleted
    expect(screen.getByText(/0 of 2 row\(s\) selected/)).toBeInTheDocument();
  });

  it('controlled selection works and reports resolved value', async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    function Harness() {
      const [sel, setSel] = React.useState({});
      return (
        <DataTable
          columns={selCols}
          data={people(3)}
          rowSelection={sel}
          onRowSelectionChange={(s) => {
            spy(s);
            setSel(s);
          }}
        />
      );
    }
    render(<Harness />);
    await user.click(screen.getAllByLabelText(/^Select row \d+$/)[0]);
    await user.click(screen.getAllByLabelText(/^Select row \d+$/)[2]);
    expect(spy).toHaveBeenLastCalledWith({ 0: true, 2: true });
    expect(bodyRows()[0]).toHaveAttribute('data-state', 'selected');
    expect(screen.getByText(/2 of 3 row\(s\) selected/)).toBeInTheDocument();
  });

  it('select-all is indeterminate with partial selection and selects only the page', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={selCols} data={people(25)} />);
    await user.click(screen.getAllByLabelText(/^Select row \d+$/)[0]);
    expect(screen.getByLabelText('Select all')).toHaveAttribute('data-state', 'indeterminate');
    await user.click(screen.getByLabelText('Select all'));
    expect(screen.getByText(/10 of 25 row\(s\) selected/)).toBeInTheDocument();
  });

  it('unselected rows do not carry data-state="false"', () => {
    render(<DataTable columns={selCols} data={people(3)} />);
    expect(bodyRows()[0]).not.toHaveAttribute('data-state', 'false');
  });

  it('row checkboxes have distinguishable accessible names', () => {
    render(<DataTable columns={selCols} data={people(3)} />);
    const names = screen.getAllByRole('checkbox').map((c) => c.getAttribute('aria-label'));
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('sorting', () => {
  const sortCols: ColumnDef<Person, unknown>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    },
    {
      accessorKey: 'age',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Age" />,
    },
    {
      accessorKey: 'email',
      enableSorting: false,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    },
  ];
  const data: Person[] = [
    { id: 'a', name: 'Charlie', email: 'c@x.com', age: 9 },
    { id: 'b', name: 'alice', email: 'a@x.com', age: 100 },
    { id: 'c', name: 'Bob', email: 'b@x.com', age: 25 },
  ];
  const names = () => bodyRows().map((r) => within(r).getAllByRole('cell')[0].textContent);

  it('cycles asc -> desc -> none', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={sortCols} data={data} />);
    const btn = screen.getByRole('button', { name: /name/i });
    await user.click(btn);
    expect(names()).toEqual(['alice', 'Bob', 'Charlie']);
    await user.click(btn);
    expect(names()).toEqual(['Charlie', 'Bob', 'alice']);
    await user.click(btn);
    expect(names()).toEqual(['Charlie', 'alice', 'Bob']);
  });

  it('numeric columns sort numerically', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={sortCols} data={data} />);
    await user.click(screen.getByRole('button', { name: /age/i }));
    expect(names()).toEqual(['Charlie', 'Bob', 'alice']);
  });

  it('sorted column header exposes aria-sort', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={sortCols} data={data} />);
    await user.click(screen.getByRole('button', { name: /name/i }));
    expect(screen.getByRole('columnheader', { name: /name/i })).toHaveAttribute(
      'aria-sort',
      'ascending'
    );
  });

  it('non-sortable column does not render an interactive sort button', () => {
    render(<DataTable columns={sortCols} data={data} />);
    expect(screen.queryByRole('button', { name: /email/i })).not.toBeInTheDocument();
  });

  it('shift+click adds a secondary sort', async () => {
    const user = userEvent.setup();
    const onSortingChange = vi.fn();
    function Harness() {
      const [s, setS] = React.useState<{ id: string; desc: boolean }[]>([]);
      return (
        <DataTable
          columns={sortCols}
          data={data}
          sorting={s}
          onSortingChange={(u) => {
            const next = typeof u === 'function' ? u(s) : u;
            onSortingChange(next);
            setS(next);
          }}
        />
      );
    }
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: /name/i }));
    await user.keyboard('{Shift>}');
    await user.click(screen.getByRole('button', { name: /age/i }));
    await user.keyboard('{/Shift}');
    expect(onSortingChange).toHaveBeenLastCalledWith([
      { id: 'name', desc: false },
      { id: 'age', desc: false },
    ]);
  });
});

describe('search / filtering', () => {
  it('globalFilterFn works when no column value is a string/number', async () => {
    const user = userEvent.setup();
    const objCols: ColumnDef<Person, unknown>[] = [
      {
        id: 'who',
        accessorFn: (r) => ({ n: r.name }),
        header: 'Who',
        cell: ({ row }) => row.original.name,
      },
    ];
    render(
      <DataTable
        columns={objCols}
        data={people(5)}
        globalFilterFn={(row, q) => row.name.includes(q)}
      />
    );
    await user.type(screen.getByPlaceholderText('Search...'), 'User 03');
    expect(bodyRows()).toHaveLength(1);
  });

  it('globalFilterFn works when the first row has null values', async () => {
    const user = userEvent.setup();
    const data = people(5).map((p, i) =>
      i === 0 ? ({ ...p, name: null, email: null } as unknown as Person) : p
    );
    render(
      <DataTable
        columns={personCols}
        data={data}
        globalFilterFn={(row, q) => (row.name ?? '').includes(q)}
      />
    );
    await user.type(screen.getByPlaceholderText('Search...'), 'User 03');
    expect(bodyRows()).toHaveLength(1);
  });

  it('globalFilterFn is invoked once per row per query, not once per column', async () => {
    const fn = vi.fn((row: Person, q: string) => row.name.includes(q));
    const fourCols: ColumnDef<Person, unknown>[] = [
      ...personCols,
      { accessorKey: 'age', header: 'Age' },
      { accessorKey: 'role', header: 'Role' },
    ];
    render(<DataTable columns={fourCols} data={people(5)} globalFilterFn={fn} />);
    fn.mockClear();
    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'zzz' } });
    expect(fn.mock.calls.length).toBeLessThanOrEqual(5);
  });

  it('searchKey on a numeric column filters by substring', async () => {
    const user = userEvent.setup();
    const c: ColumnDef<Person, unknown>[] = [...personCols, { accessorKey: 'age', header: 'Age' }];
    render(<DataTable columns={c} data={people(25)} searchKey="age" pageSize={50} />);
    await user.type(screen.getByPlaceholderText('Search...'), '3');
    // ages 20..44 containing "3": 23,30..39,43 = 12
    expect(bodyRows()).toHaveLength(12);
  });

  it('searchKey pointing at an unknown column still lets the user type', async () => {
    const user = userEvent.setup();
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<DataTable columns={personCols} data={people(3)} searchKey="nope" />);
    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'abc');
    expect(input).toHaveValue('abc');
    err.mockRestore();
  });

  it('searchKey search is case-insensitive', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={personCols} data={people(12)} searchKey="name" />);
    await user.type(screen.getByPlaceholderText('Search...'), 'uSeR 11');
    expect(bodyRows()).toHaveLength(1);
  });

  it('search input has an accessible name beyond the placeholder', () => {
    render(<DataTable columns={personCols} data={people(3)} searchKey="name" />);
    const input = screen.getByPlaceholderText('Search...');
    expect(input.getAttribute('aria-label') ?? input.getAttribute('aria-labelledby')).toBeTruthy();
  });
});

describe('column visibility', () => {
  const c: ColumnDef<Person, unknown>[] = [
    { accessorKey: 'name', header: 'Full name' },
    { accessorKey: 'joined', header: 'Start date' },
  ];

  it('toggle menu labels use the header text, not the raw column id', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={c} data={people(3)} />);
    await user.click(screen.getByRole('button', { name: /columns/i }));
    expect(screen.getByRole('menuitemcheckbox', { name: 'Start date' })).toBeInTheDocument();
  });

  it('unchecking a column hides it', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={c} data={people(3)} />);
    await user.click(screen.getByRole('button', { name: /columns/i }));
    await user.click(screen.getByRole('menuitemcheckbox', { name: /joined|start date/i }));
    expect(screen.queryByRole('columnheader', { name: 'Start date' })).not.toBeInTheDocument();
  });

  it('empty-state cell spans exactly the visible columns', () => {
    render(<DataTable columns={c} data={[]} columnVisibility={{ joined: false }} />);
    expect(screen.getByText('No results.')).toHaveAttribute('colspan', '1');
  });
});

describe('sizing / resizing', () => {
  it('cells do not get a bogus max-width from TanStack defaults', () => {
    render(<DataTable columns={personCols} data={people(1)} />);
    const td = screen.getByText('User 00').closest('td') as HTMLElement;
    expect(td.style.maxWidth).toBe('');
    expect(td.style.minWidth).toBe('');
  });

  it('an explicit size of 150 is honoured like any other size', () => {
    const c: ColumnDef<Person, unknown>[] = [
      { accessorKey: 'name', header: 'Name', size: 150 },
      { accessorKey: 'email', header: 'Email', size: 151 },
    ];
    render(<DataTable columns={c} data={people(1)} />);
    expect(screen.getByText('Email').closest('th')).toHaveStyle({ width: '151px' });
    expect(screen.getByText('Name').closest('th')).toHaveStyle({ width: '150px' });
  });

  it('resize separator advertises sane aria bounds', () => {
    render(<DataTable columns={personCols} data={people(1)} resizable />);
    const sep = screen.getAllByRole('separator')[0];
    expect(Number(sep.getAttribute('aria-valuemax'))).toBe(1000);
    expect(Number(sep.getAttribute('aria-valuemin'))).toBe(20); // TanStack default minSize
    expect(sep).toHaveAccessibleName('Resize Name column');
  });

  it('focused resize separator responds to arrow keys', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={personCols} data={people(1)} resizable />);
    const sep = screen.getAllByRole('separator')[0];
    sep.focus();
    const before = sep.getAttribute('aria-valuenow');
    await user.keyboard('{ArrowRight}');
    expect(sep.getAttribute('aria-valuenow')).not.toBe(before);
  });

  it('resize separators have distinguishable names and vertical orientation', () => {
    render(<DataTable columns={personCols} data={people(1)} resizable />);
    const seps = screen.getAllByRole('separator');
    expect(new Set(seps.map((s) => s.getAttribute('aria-label'))).size).toBe(seps.length);
    expect(seps[0]).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('mouse drag resizes and fires onColumnSizingChange', () => {
    const spy = vi.fn();
    render(
      <DataTable columns={personCols} data={people(1)} resizable onColumnSizingChange={spy} />
    );
    const sep = screen.getAllByRole('separator')[0];
    fireEvent.mouseDown(sep, { clientX: 100 });
    fireEvent.mouseMove(document, { clientX: 160 });
    fireEvent.mouseUp(document, { clientX: 160 });
    expect(spy).toHaveBeenCalled();
    expect(screen.getByText('Name').closest('th')).toHaveStyle({ width: '210px' });
  });
});

describe('inline editing', () => {
  const editCols: ColumnDef<Person, unknown>[] = [
    { accessorKey: 'name', header: 'Name', meta: { type: 'text' } },
    { accessorKey: 'age', header: 'Age', meta: { type: 'number' } },
    { accessorKey: 'joined', header: 'Joined', meta: { type: 'date' } },
    { accessorKey: 'active', header: 'Active', meta: { type: 'checkbox' } },
  ];

  it('Enter commits exactly once', async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(<DataTable columns={editCols} data={people(2)} editable onCellUpdate={spy} />);
    await user.click(screen.getByText('User 00'));
    await user.type(screen.getByRole('textbox'), 'X{Enter}');
    await user.click(document.body);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(0, 'name', 'User 00X');
  });

  it('Escape cancels without committing', async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(<DataTable columns={editCols} data={people(2)} editable onCellUpdate={spy} />);
    await user.click(screen.getByText('User 00'));
    await user.type(screen.getByRole('textbox'), 'X{Escape}');
    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByText('User 00')).toBeInTheDocument();
  });

  it('clearing a number cell never commits NaN', async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<DataTable columns={editCols} data={people(2)} editable onCellUpdate={spy} />);
    await user.click(screen.getByText('20'));
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.keyboard('{Enter}');
    const committed = spy.mock.calls.map((c) => c[2]);
    expect(committed.some((v) => typeof v === 'number' && Number.isNaN(v))).toBe(false);
    expect(err.mock.calls.map((c) => String(c[0])).join('\n')).not.toMatch(/NaN/);
    err.mockRestore();
  });

  it('number cell enforces min/max', async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    const c: ColumnDef<Person, unknown>[] = [
      { accessorKey: 'age', header: 'Age', meta: { type: 'number', min: 0, max: 120 } },
    ];
    render(<DataTable columns={c} data={people(1)} editable onCellUpdate={spy} />);
    await user.click(screen.getByText('20'));
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '999{Enter}');
    expect(spy).not.toHaveBeenCalledWith(0, 'age', 999);
  });

  it('an unparseable date value does not crash the table', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const data = [{ ...people(1)[0], joined: 'not-a-date' }];
    expect(() =>
      render(<DataTable columns={editCols} data={data} editable onCellUpdate={vi.fn()} />)
    ).not.toThrow();
    err.mockRestore();
  });

  it('an in-progress edit survives a parent re-render with an inline onCellUpdate', async () => {
    const user = userEvent.setup();
    let bump!: () => void;
    function Harness() {
      const [, setN] = React.useState(0);
      bump = () => setN((n) => n + 1);
      const [data] = React.useState(() => people(2));
      return <DataTable columns={editCols} data={data} editable onCellUpdate={() => {}} />;
    }
    render(<Harness />);
    await user.click(screen.getByText('User 00'));
    await user.type(screen.getByRole('textbox'), 'abc');
    act(() => bump());
    expect(screen.queryByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('User 00abc');
  });

  it('onCellUpdate row index is the source-data index under sort + pagination', async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(
      <DataTable
        columns={editCols}
        data={people(25)}
        editable
        onCellUpdate={spy}
        initialSorting={[{ id: 'name', desc: true }]}
      />
    );
    await user.click(screen.getByText('User 24'));
    await user.type(screen.getByRole('textbox'), '!{Enter}');
    expect(spy).toHaveBeenCalledWith(24, 'name', 'User 24!');
  });

  it('checkbox cells have distinguishable accessible names', () => {
    render(<DataTable columns={editCols} data={people(2)} editable onCellUpdate={vi.fn()} />);
    const labels = screen.getAllByRole('checkbox').map((c) => c.getAttribute('aria-label'));
    expect(labels).toEqual(['Active, row 1', 'Active, row 2']);
  });

  it('zero is rendered as a real value, not styled as empty', () => {
    const data = [{ ...people(1)[0], age: 0 }];
    render(<DataTable columns={editCols} data={data} editable onCellUpdate={vi.fn()} />);
    expect(screen.getByText('0')).not.toHaveClass('text-muted-foreground');
  });

  it('editable without onCellUpdate stays read-only and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<DataTable columns={editCols} data={people(1)} editable />);
    expect(screen.queryByRole('button', { name: /edit name/i })).not.toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('onCellUpdate'));
    warn.mockRestore();
  });

  it('returns focus to the cell after Enter and after Escape', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={editCols} data={people(2)} editable onCellUpdate={vi.fn()} />);
    const cell = screen.getByRole('button', { name: 'Edit Name, row 1' });
    await user.click(cell);
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Edit Name, row 1' })).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.type(screen.getByRole('textbox'), 'X{Enter}');
    expect(screen.getByRole('button', { name: 'Edit Name, row 1' })).toHaveFocus();
  });

  it('a cleared number cell keeps its value unless the column is nullable', async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    const c: ColumnDef<Person, unknown>[] = [
      { accessorKey: 'age', header: 'Age', meta: { type: 'number', nullable: true } },
    ];
    render(<DataTable columns={c} data={people(1)} editable onCellUpdate={spy} />);
    await user.click(screen.getByText('20'));
    await user.clear(screen.getByRole('spinbutton'));
    await user.keyboard('{Enter}');
    expect(spy).toHaveBeenCalledWith(0, 'age', null);
  });

  it('clamps a number cell to min/max on commit', async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    const c: ColumnDef<Person, unknown>[] = [
      { accessorKey: 'age', header: 'Age', meta: { type: 'number', min: 0, max: 120 } },
    ];
    render(<DataTable columns={c} data={people(1)} editable onCellUpdate={spy} />);
    await user.click(screen.getByText('20'));
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '999{Enter}');
    expect(spy).toHaveBeenCalledWith(0, 'age', 120);
  });
});

describe('a11y (axe) across feature combinations', () => {
  const full = [
    DataTableSelectColumn<Person>(),
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      meta: { type: 'text' },
    },
    { accessorKey: 'age', header: 'Age', meta: { type: 'number' } },
    { accessorKey: 'active', header: 'Active', meta: { type: 'checkbox' } },
  ] as ColumnDef<Person, unknown>[];

  it('select + sort + resizable + editable', async () => {
    const { container } = render(
      <DataTable columns={full} data={people(3)} resizable editable onCellUpdate={vi.fn()} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('maxBodyHeight block layout', async () => {
    const { container } = render(
      <DataTable columns={full} data={people(30)} maxBodyHeight="200px" />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('empty state', async () => {
    const { container } = render(<DataTable columns={full} data={[]} resizable />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('scrollable body region has an accessible name', () => {
    render(<DataTable columns={personCols} data={people(30)} maxBodyHeight="200px" />);
    const tbody = document.querySelector('tbody') as HTMLElement;
    expect(tbody.getAttribute('aria-label') ?? tbody.getAttribute('aria-labelledby')).toBeTruthy();
  });
});

describe('resize keyboard', () => {
  const sized: ColumnDef<Person, unknown>[] = [
    { accessorKey: 'name', header: 'Name', size: 200, minSize: 100, maxSize: 300 },
    { accessorKey: 'email', header: 'Email' },
  ];
  const width = () => screen.getByText('Name').closest('th')?.style.width;

  it('arrows step by 10, shift+arrows by 50, Home/End jump to the bounds, Enter resets', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={sized} data={people(1)} resizable />);
    screen.getByRole('separator', { name: 'Resize Name column' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(width()).toBe('210px');
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    expect(width()).toBe('160px');
    await user.keyboard('{Home}');
    expect(width()).toBe('100px');
    await user.keyboard('{ArrowLeft}');
    expect(width()).toBe('100px');
    await user.keyboard('{End}');
    expect(width()).toBe('300px');
    await user.keyboard('{Enter}');
    expect(width()).toBe('200px');
  });

  it('double-click resets a resized column', () => {
    render(<DataTable columns={sized} data={people(1)} resizable columnSizing={undefined} />);
    const sep = screen.getByRole('separator', { name: 'Resize Name column' });
    fireEvent.keyDown(sep, { key: 'ArrowRight' });
    expect(width()).toBe('210px');
    fireEvent.doubleClick(sep);
    expect(width()).toBe('200px');
  });

  it('the select column is narrow and not resizable', () => {
    const c = [DataTableSelectColumn<Person>(), ...sized] as ColumnDef<Person, unknown>[];
    render(<DataTable columns={c} data={people(1)} resizable />);
    expect(screen.getAllByRole('separator')).toHaveLength(2);
    expect(screen.getByLabelText('Select all').closest('th')).toHaveStyle({ width: '48px' });
  });
});

describe('pagination: page size, controlled and server-side', () => {
  it('pageSizeOptions renders a picker that changes the page size and returns to page 1', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={personCols} data={people(25)} pageSizeOptions={[10, 20, 50]} />);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('combobox', { name: 'Rows per page' }));
    await user.click(screen.getByRole('option', { name: '20' }));
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(20);
  });

  it('sorting returns to the first page', async () => {
    const user = userEvent.setup();
    const c: ColumnDef<Person, unknown>[] = [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      },
    ];
    render(<DataTable columns={c} data={people(25)} />);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: /name/i }));
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('stays in range when the data shrinks under the current page', () => {
    const { rerender } = render(
      <DataTable columns={personCols} data={people(25)} initialSorting={[]} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();
    rerender(<DataTable columns={personCols} data={people(12)} initialSorting={[]} />);
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(2);
  });

  it('controlled pagination forwards updaters and renders the given page', async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    function Harness() {
      const [p, setP] = React.useState({ pageIndex: 1, pageSize: 5 });
      return (
        <DataTable
          columns={personCols}
          data={people(25)}
          pagination={p}
          onPaginationChange={(u) => {
            const next = typeof u === 'function' ? u(p) : u;
            spy(next);
            setP(next);
          }}
        />
      );
    }
    render(<Harness />);
    expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();
    expect(bodyRows()[0]).toHaveTextContent('User 05');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(spy).toHaveBeenLastCalledWith({ pageIndex: 2, pageSize: 5 });
    expect(bodyRows()[0]).toHaveTextContent('User 10');
  });

  it('manualPagination renders the given rows as is and derives the page count from rowCount', () => {
    render(
      <DataTable
        columns={personCols}
        data={people(5)}
        manualPagination
        rowCount={103}
        pagination={{ pageIndex: 3, pageSize: 5 }}
        onPaginationChange={vi.fn()}
      />
    );
    expect(bodyRows()).toHaveLength(5);
    expect(screen.getByText('Page 4 of 21')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });
});

describe('controlled search', () => {
  it('filters by searchValue and reports typing through onSearchChange', async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    function Harness() {
      const [q, setQ] = React.useState('User 03');
      return (
        <DataTable
          columns={personCols}
          data={people(12)}
          searchKey="name"
          searchValue={q}
          onSearchChange={(v) => {
            spy(v);
            setQ(v);
          }}
        />
      );
    }
    render(<Harness />);
    expect(bodyRows()).toHaveLength(1);
    await user.clear(screen.getByRole('textbox', { name: 'Search...' }));
    expect(spy).toHaveBeenLastCalledWith('');
    expect(bodyRows()).toHaveLength(10);
  });
});

describe('rows: click, loading, empty', () => {
  it('onRowClick fires for a row click and for Enter, but not for controls inside the row', async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    const c = [DataTableSelectColumn<Person>(), ...personCols] as ColumnDef<Person, unknown>[];
    const data = people(2);
    render(<DataTable columns={c} data={data} onRowClick={spy} />);
    await user.click(screen.getByText('User 01'));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(data[1]);
    await user.click(screen.getByLabelText('Select row 1'));
    expect(spy).toHaveBeenCalledTimes(1);
    bodyRows()[0].focus();
    await user.keyboard('{Enter}');
    expect(spy).toHaveBeenLastCalledWith(data[0]);
  });

  it('loading with no data shows placeholder rows instead of the empty state', () => {
    render(<DataTable columns={personCols} data={[]} loading />);
    expect(screen.queryByText('No results.')).not.toBeInTheDocument();
    expect(
      document.querySelectorAll('[data-slot="data-table-loading-row"]').length
    ).toBeGreaterThan(0);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
  });

  it('loading with data keeps the rows', () => {
    render(<DataTable columns={personCols} data={people(3)} loading />);
    expect(bodyRows()).toHaveLength(3);
  });

  it('emptyState replaces the default text', () => {
    render(<DataTable columns={personCols} data={[]} emptyState={<span>Nothing here yet</span>} />);
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
    expect(screen.queryByText('No results.')).not.toBeInTheDocument();
  });

  it('has no accessibility violations while loading and with clickable rows', async () => {
    const { container, rerender } = render(<DataTable columns={personCols} data={[]} loading />);
    expect(await axe(container)).toHaveNoViolations();
    rerender(<DataTable columns={personCols} data={people(3)} onRowClick={vi.fn()} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('API surface', () => {
  it('passes className through to the root', () => {
    render(<DataTable columns={personCols} data={people(1)} className="probe-class" />);
    expect(document.querySelector('[data-slot="data-table"]')).toHaveClass('probe-class', 'w-full');
  });

  it('every built-in string is overridable through `strings`', async () => {
    const user = userEvent.setup();
    const c = [
      DataTableSelectColumn<Person>(),
      { accessorKey: 'name', header: 'Nom', meta: { type: 'text' } },
      { accessorKey: 'active', header: 'Actif', meta: { type: 'checkbox' } },
    ] as ColumnDef<Person, unknown>[];
    const strings = {
      search: 'Rechercher',
      noResults: 'Aucun résultat.',
      loading: 'Chargement',
      previous: 'Précédent',
      next: 'Suivant',
      page: (page: number, count: number) => `Page ${page} sur ${count}`,
      rowsSelected: (selected: number, total: number) => `${selected} sur ${total} sélectionnée(s)`,
      rowsPerPage: 'Lignes par page',
      selectAll: 'Tout sélectionner',
      selectRow: (n: number) => `Sélectionner la ligne ${n}`,
      resizeColumn: (column: string) => `Redimensionner ${column}`,
      editCell: (column: string, n: number) => `Modifier ${column}, ligne ${n}`,
      toggleCell: (column: string, n: number) => `${column}, ligne ${n}`,
      scrollRegion: 'Lignes du tableau',
    };
    const { rerender } = render(
      <DataTable
        columns={c}
        data={people(2)}
        strings={strings}
        searchKey="name"
        resizable
        editable
        onCellUpdate={vi.fn()}
        pageSizeOptions={[10, 20]}
        maxBodyHeight="200px"
        loading
      />
    );
    expect(screen.getByRole('textbox', { name: 'Rechercher' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Précédent' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeInTheDocument();
    expect(screen.getByText('Page 1 sur 1')).toBeInTheDocument();
    expect(screen.getByText('0 sur 2 sélectionnée(s)')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Lignes par page' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tout sélectionner')).toBeInTheDocument();
    expect(screen.getByLabelText('Sélectionner la ligne 2')).toBeInTheDocument();
    expect(screen.getByRole('separator', { name: 'Redimensionner Nom' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Modifier Nom, ligne 1' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Actif, ligne 2' })).toBeInTheDocument();
    expect(document.querySelector('tbody')).toHaveAttribute('aria-label', 'Lignes du tableau');
    expect(screen.getByRole('status')).toHaveTextContent('Chargement');
    await user.type(screen.getByRole('textbox', { name: 'Rechercher' }), 'zzz');
    rerender(<DataTable columns={c} data={[]} strings={strings} />);
    expect(screen.getByText('Aucun résultat.')).toBeInTheDocument();
  });

  it('meta.label names a column whose header is not a string', async () => {
    const user = userEvent.setup();
    const c: ColumnDef<Person, unknown>[] = [
      {
        accessorKey: 'joined',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Start date" />,
        meta: { label: 'Start date' },
      },
    ];
    render(<DataTable columns={c} data={people(1)} resizable />);
    expect(screen.getByRole('separator', { name: 'Resize Start date column' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /columns/i }));
    expect(screen.getByRole('menuitemcheckbox', { name: 'Start date' })).toBeInTheDocument();
  });

  it('sorts text case-insensitively and in natural number order, with empty values last', async () => {
    const user = userEvent.setup();
    const c: ColumnDef<Person, unknown>[] = [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      },
    ];
    const data = ['item 10', 'Item 2', '', 'apple', 'Banana'].map((name, i) => ({
      ...people(1)[0],
      id: String(i),
      name,
    }));
    render(<DataTable columns={c} data={data} />);
    await user.click(screen.getByRole('button', { name: /name/i }));
    expect(bodyRows().map((r) => r.textContent)).toEqual([
      'apple',
      'Banana',
      'Item 2',
      'item 10',
      '',
    ]);
  });
});

describe('compatibility with the previous behaviour', () => {
  it('a header that calls column.setFilterValue still filters, alongside the search input', async () => {
    const user = userEvent.setup();
    const c: ColumnDef<Person, unknown>[] = [
      { accessorKey: 'name', header: 'Name' },
      {
        accessorKey: 'role',
        header: ({ column }) => (
          <button type="button" onClick={() => column.setFilterValue('guest')}>
            Only guests
          </button>
        ),
      },
    ];
    const data = people(12).map((p, i) => ({ ...p, role: i % 4 === 0 ? 'guest' : 'admin' }));
    render(<DataTable columns={c} data={data} searchKey="name" pageSize={50} />);
    await user.click(screen.getByRole('button', { name: 'Only guests' }));
    expect(bodyRows()).toHaveLength(3);
    await user.type(screen.getByPlaceholderText('Search...'), 'User 08');
    expect(bodyRows()).toHaveLength(1);
    await user.clear(screen.getByPlaceholderText('Search...'));
    expect(bodyRows()).toHaveLength(3);
  });

  it('keeps the toolbar row (and its spacing) when it has nothing in it', () => {
    render(<DataTable columns={personCols} data={people(1)} showColumnToggle={false} />);
    const root = document.querySelector('[data-slot="data-table"]') as HTMLElement;
    expect(root.firstElementChild).toHaveClass('py-4');
    expect(root.firstElementChild?.childElementCount).toBe(0);
  });

  it('a hand-rolled select column shows the selection count once a row is selected', async () => {
    const user = userEvent.setup();
    const c: ColumnDef<Person, unknown>[] = [
      {
        id: 'pick',
        header: 'Pick',
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`pick ${row.index}`}
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(e.target.checked)}
          />
        ),
      },
      ...personCols,
    ];
    render(<DataTable columns={c} data={people(3)} />);
    await user.click(screen.getByLabelText('pick 1'));
    expect(screen.getByText('1 of 3 row(s) selected.')).toBeInTheDocument();
  });

  it('DataTableColumnHeader works with a partial column mock', async () => {
    const user = userEvent.setup();
    const column = { toggleSorting: vi.fn(), getIsSorted: () => false };
    render(<DataTableColumnHeader column={column as never} title="Name" />);
    await user.click(screen.getByRole('button', { name: 'Name' }));
    expect(column.toggleSorting).toHaveBeenCalledWith(false, false);
  });
});

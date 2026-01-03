import type { Meta } from '@storybook/react-vite';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import * as React from 'react';
import { Badge } from './badge';
import { Button } from './button';
import { DataTable, DataTableColumnHeader, DataTableSelectColumn } from './data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from './dropdown-menu';
import type { EditableCellMeta } from './editable-cell';

const meta = {
  title: 'Design System/Data Display/Data Table',
  component: DataTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DataTable>;

export default meta;

// Sample data types
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
};

const sampleUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'active',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'active',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'User',
    status: 'inactive',
  },
  {
    id: '4',
    name: 'Alice Williams',
    email: 'alice@example.com',
    role: 'Manager',
    status: 'active',
  },
  {
    id: '5',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    role: 'User',
    status: 'pending',
  },
  {
    id: '6',
    name: 'Diana Prince',
    email: 'diana@example.com',
    role: 'Admin',
    status: 'active',
  },
  {
    id: '7',
    name: 'Eve Anderson',
    email: 'eve@example.com',
    role: 'User',
    status: 'inactive',
  },
  {
    id: '8',
    name: 'Frank Miller',
    email: 'frank@example.com',
    role: 'Manager',
    status: 'active',
  },
  {
    id: '9',
    name: 'Grace Lee',
    email: 'grace@example.com',
    role: 'User',
    status: 'active',
  },
  {
    id: '10',
    name: 'Henry Davis',
    email: 'henry@example.com',
    role: 'User',
    status: 'pending',
  },
  {
    id: '11',
    name: 'Ivy Wilson',
    email: 'ivy@example.com',
    role: 'Admin',
    status: 'active',
  },
  {
    id: '12',
    name: 'Jack Taylor',
    email: 'jack@example.com',
    role: 'User',
    status: 'inactive',
  },
];

const basicColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge
          variant={
            status === 'active' ? 'default' : status === 'inactive' ? 'secondary' : 'outline'
          }
        >
          {status}
        </Badge>
      );
    },
  },
];

const sortableColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
  },
  {
    accessorKey: 'role',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge
          variant={
            status === 'active' ? 'default' : status === 'inactive' ? 'secondary' : 'outline'
          }
        >
          {status}
        </Badge>
      );
    },
  },
];

const selectableColumns: ColumnDef<User>[] = [
  DataTableSelectColumn<User>(),
  ...sortableColumns,
  {
    id: 'actions',
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.id)}>
              Copy user ID
            </DropdownMenuItem>
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit user</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export const Default = {
  args: {},
  render: () => <DataTable columns={basicColumns} data={sampleUsers} />,
};

export const WithSearch = {
  args: {},
  render: () => (
    <DataTable
      columns={basicColumns}
      data={sampleUsers}
      searchKey="name"
      searchPlaceholder="Search by name..."
    />
  ),
};

export const Sortable = {
  args: {},
  render: () => (
    <DataTable
      columns={sortableColumns}
      data={sampleUsers}
      searchKey="name"
      searchPlaceholder="Search by name..."
    />
  ),
};

export const WithSelection = {
  args: {},
  render: () => (
    <DataTable
      columns={selectableColumns}
      data={sampleUsers}
      searchKey="name"
      searchPlaceholder="Search by name..."
    />
  ),
};

export const NoPagination = {
  args: {},
  render: () => (
    <DataTable columns={basicColumns} data={sampleUsers.slice(0, 5)} showPagination={false} />
  ),
};

export const NoColumnToggle = {
  args: {},
  render: () => (
    <DataTable
      columns={basicColumns}
      data={sampleUsers}
      showColumnToggle={false}
      searchKey="name"
    />
  ),
};

export const CustomPageSize = {
  args: {},
  render: () => (
    <DataTable columns={sortableColumns} data={sampleUsers} searchKey="name" pageSize={5} />
  ),
};

// Editable table types and data
type Task = {
  id: string;
  name: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  completed: boolean;
};

const initialTasks: Task[] = [
  {
    id: '1',
    name: 'Design homepage mockup',
    status: 'in-progress',
    priority: 'high',
    dueDate: new Date('2024-12-15'),
    completed: false,
  },
  {
    id: '2',
    name: 'Review pull request',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date('2024-12-10'),
    completed: false,
  },
  {
    id: '3',
    name: 'Update documentation',
    status: 'done',
    priority: 'low',
    dueDate: new Date('2024-12-05'),
    completed: true,
  },
  {
    id: '4',
    name: 'Fix navigation bug',
    status: 'in-progress',
    priority: 'high',
    dueDate: null,
    completed: false,
  },
  {
    id: '5',
    name: 'Write unit tests',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date('2024-12-20'),
    completed: false,
  },
];

const editableColumns: ColumnDef<Task, unknown>[] = [
  {
    accessorKey: 'completed',
    header: '',
    meta: { type: 'checkbox' } as EditableCellMeta,
    size: 50,
    minSize: 50,
    maxSize: 50,
  },
  {
    accessorKey: 'name',
    header: 'Task',
    meta: {
      type: 'text',
      placeholder: 'Enter task name...',
    } as EditableCellMeta,
    size: 250,
    minSize: 200,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: {
      type: 'select',
      options: [
        { value: 'todo', label: 'To Do' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'done', label: 'Done' },
      ],
    } as EditableCellMeta,
    size: 140,
    minSize: 120,
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    meta: {
      type: 'select',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
    } as EditableCellMeta,
    size: 120,
    minSize: 100,
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    meta: { type: 'date', placeholder: 'Set due date' } as EditableCellMeta,
    size: 180,
    minSize: 150,
  },
];

function EditableTableExample() {
  const [data, setData] = React.useState<Task[]>(initialTasks);

  const handleCellUpdate = (rowIndex: number, columnId: string, value: unknown) => {
    setData((prev) => {
      const newData = [...prev];
      newData[rowIndex] = {
        ...newData[rowIndex],
        [columnId]: value,
      };
      return newData;
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Click on any cell to edit. Changes are saved automatically.
      </div>
      <DataTable
        columns={editableColumns}
        data={data}
        editable
        onCellUpdate={handleCellUpdate}
        showPagination={false}
        showColumnToggle={false}
      />
    </div>
  );
}

export const Editable = {
  args: {},
  render: () => <EditableTableExample />,
};

export const Resizable = {
  args: {},
  render: () => (
    <DataTable columns={sortableColumns} data={sampleUsers} searchKey="name" resizable />
  ),
};

export const Compact = {
  args: {},
  render: () => <DataTable columns={sortableColumns} data={sampleUsers} searchKey="name" compact />,
};

// Full-featured editable table with all options
const editableSortableColumns: ColumnDef<Task, unknown>[] = [
  DataTableSelectColumn<Task>(),
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Task" />,
    meta: {
      type: 'text',
      placeholder: 'Enter task name...',
    } as EditableCellMeta,
    size: 250,
    minSize: 150,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    meta: {
      type: 'select',
      options: [
        { value: 'todo', label: 'To Do' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'done', label: 'Done' },
      ],
    } as EditableCellMeta,
    size: 140,
    minSize: 100,
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
    meta: {
      type: 'select',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
    } as EditableCellMeta,
    size: 120,
    minSize: 100,
  },
  {
    accessorKey: 'dueDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
    meta: { type: 'date', placeholder: 'Set due date' } as EditableCellMeta,
    size: 180,
    minSize: 140,
  },
];

function FullFeaturedTableExample() {
  const [data, setData] = React.useState<Task[]>(initialTasks);

  const handleCellUpdate = (rowIndex: number, columnId: string, value: unknown) => {
    setData((prev) => {
      const newData = [...prev];
      newData[rowIndex] = {
        ...newData[rowIndex],
        [columnId]: value,
      };
      return newData;
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Compact, resizable, editable, sortable, and filterable table.
      </div>
      <DataTable
        columns={editableSortableColumns}
        data={data}
        editable
        onCellUpdate={handleCellUpdate}
        resizable
        compact
        searchKey="name"
        searchPlaceholder="Filter tasks..."
        showPagination
        pageSize={10}
      />
    </div>
  );
}

export const FullFeatured = {
  args: {},
  render: () => <FullFeaturedTableExample />,
};

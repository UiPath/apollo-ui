import type { Meta } from '@storybook/react-vite';
import { ColumnDef } from '@tanstack/react-table';
import {
  Archive,
  ChevronDown,
  ChevronRight,
  Download,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';
import { Badge } from './badge';
import { Button } from './button';
import { DataTable, DataTableColumnHeader, DataTableSelectColumn } from './data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import type { EditableCellMeta } from './editable-cell';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Separator } from './separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';

const meta = {
  title: 'Components/Data Display/Data Table',
  component: DataTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DataTable>;

export default meta;

// ---------------------------------------------------------------------------
// Shared data
// ---------------------------------------------------------------------------

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  department: string;
  joined: string;
};

const sampleUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active', department: 'Engineering', joined: '2023-01-15' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active', department: 'Design', joined: '2023-03-22' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'inactive', department: 'Marketing', joined: '2022-11-08' },
  { id: '4', name: 'Alice Williams', email: 'alice@example.com', role: 'Manager', status: 'active', department: 'Engineering', joined: '2022-06-30' },
  { id: '5', name: 'Charlie Brown', email: 'charlie@example.com', role: 'User', status: 'pending', department: 'Sales', joined: '2024-01-10' },
  { id: '6', name: 'Diana Prince', email: 'diana@example.com', role: 'Admin', status: 'active', department: 'Engineering', joined: '2021-09-01' },
  { id: '7', name: 'Eve Anderson', email: 'eve@example.com', role: 'User', status: 'inactive', department: 'Design', joined: '2023-07-18' },
  { id: '8', name: 'Frank Miller', email: 'frank@example.com', role: 'Manager', status: 'active', department: 'Product', joined: '2022-04-12' },
  { id: '9', name: 'Grace Lee', email: 'grace@example.com', role: 'User', status: 'active', department: 'Engineering', joined: '2023-09-05' },
  { id: '10', name: 'Henry Davis', email: 'henry@example.com', role: 'User', status: 'pending', department: 'Marketing', joined: '2024-02-20' },
  { id: '11', name: 'Ivy Wilson', email: 'ivy@example.com', role: 'Admin', status: 'active', department: 'Product', joined: '2021-12-11' },
  { id: '12', name: 'Jack Taylor', email: 'jack@example.com', role: 'User', status: 'inactive', department: 'Sales', joined: '2023-05-25' },
];

const statusBadge = (status: string) => (
  <Badge variant={status === 'active' ? 'default' : status === 'inactive' ? 'secondary' : 'outline'}>
    {status}
  </Badge>
);

const basicColumns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => statusBadge(row.getValue('status')) },
];

const sortableColumns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Name" /> },
  { accessorKey: 'email', header: ({ column }) => <DataTableColumnHeader column={column} title="Email" /> },
  { accessorKey: 'role', header: ({ column }) => <DataTableColumnHeader column={column} title="Role" /> },
  { accessorKey: 'department', header: ({ column }) => <DataTableColumnHeader column={column} title="Department" /> },
  { accessorKey: 'status', header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />, cell: ({ row }) => statusBadge(row.getValue('status')) },
];

// ============================================================================
// Basic
// ============================================================================

export const Basic = {
  name: 'Basic',
  render: () => (
    <DataTable
      columns={basicColumns}
      data={sampleUsers}
      showColumnToggle={false}
    />
  ),
};

// ============================================================================
// Drag and Drop
// ============================================================================

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

function DraggableRow({ user, children }: { user: User; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: user.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-[40px]">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </Button>
      </TableCell>
      {children}
    </TableRow>
  );
}

function DragAndDropExample() {
  const [data, setData] = React.useState(sampleUsers.slice(0, 6));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setData((prev) => {
        const oldIndex = prev.findIndex((u) => u.id === active.id);
        const newIndex = prev.findIndex((u) => u.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Drag the grip handle to reorder rows.</p>
      <div className="rounded-md border">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={data.map((u) => u.id)} strategy={verticalListSortingStrategy}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]" />
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((user) => (
                  <DraggableRow key={user.id} user={user}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{statusBadge(user.status)}</TableCell>
                  </DraggableRow>
                ))}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

export const DragAndDrop = {
  name: 'Drag and Drop',
  render: () => <DragAndDropExample />,
};

// ============================================================================
// Expandable Rows
// ============================================================================

function ExpandableRowsExample() {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]" />
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sampleUsers.slice(0, 6).map((user) => (
            <React.Fragment key={user.id}>
              <TableRow>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => toggle(user.id)}
                  >
                    {expanded[user.id] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{statusBadge(user.status)}</TableCell>
              </TableRow>
              {expanded[user.id] && (
                <TableRow>
                  <TableCell colSpan={5} className="bg-muted/50 p-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Department</p>
                        <p className="font-medium">{user.department}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Joined</p>
                        <p className="font-medium">{user.joined}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ID</p>
                        <p className="font-medium">{user.id}</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export const ExpandableRows = {
  name: 'Expandable Rows',
  render: () => <ExpandableRowsExample />,
};

// ============================================================================
// Bulk Actions
// ============================================================================

function BulkActionsExample() {
  const [data, setData] = React.useState(sampleUsers);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  const selectedCount = Object.values(rowSelection).filter(Boolean).length;
  const selectedIndices = Object.entries(rowSelection)
    .filter(([, v]) => v)
    .map(([k]) => Number(k));

  const handleClear = () => setRowSelection({});

  const handleExport = () => {
    const rows = selectedIndices.map((i) => data[i]).filter(Boolean);
    const header = ['Name', 'Email', 'Role', 'Department', 'Status'].join(',');
    const csv = [header, ...rows.map((u) => [u.name, u.email, u.role, u.department, u.status].join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleArchive = () => {
    setData((prev) =>
      prev.map((user, i) =>
        selectedIndices.includes(i) ? { ...user, status: 'inactive' as const } : user,
      ),
    );
    setRowSelection({});
  };

  const handleDelete = () => {
    setData((prev) => prev.filter((_, i) => !selectedIndices.includes(i)));
    setRowSelection({});
  };

  const columns: ColumnDef<User>[] = [
    DataTableSelectColumn<User>(),
    { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Name" /> },
    { accessorKey: 'email', header: ({ column }) => <DataTableColumnHeader column={column} title="Email" /> },
    { accessorKey: 'role', header: 'Role' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => statusBadge(row.getValue('status')) },
  ];

  const bulkActions = selectedCount > 0 ? (
    <>
      <Separator orientation="vertical" className="h-4" />
      <span className="text-sm font-medium whitespace-nowrap">{selectedCount} selected</span>
      <Button variant="ghost" size="sm" onClick={handleClear}>
        <X className="mr-1 h-3.5 w-3.5" />
        Clear
      </Button>
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="mr-1 h-3.5 w-3.5" />
        Export
      </Button>
      <Button variant="outline" size="sm" onClick={handleArchive}>
        <Archive className="mr-1 h-3.5 w-3.5" />
        Archive
      </Button>
      <Button variant="destructive" size="sm" onClick={handleDelete}>
        <Trash2 className="mr-1 h-3.5 w-3.5" />
        Delete
      </Button>
    </>
  ) : null;

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Search users..."
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      toolbarContent={bulkActions}
    />
  );
}

export const BulkActions = {
  name: 'Bulk Actions',
  render: () => <BulkActionsExample />,
};

// ============================================================================
// Inline Editing
// ============================================================================

type Task = {
  id: string;
  name: string;
  status: string;
  priority: string;
};

const initialTasks: Task[] = [
  { id: '1', name: 'Design homepage mockup', status: 'in-progress', priority: 'high' },
  { id: '2', name: 'Review pull request', status: 'todo', priority: 'medium' },
  { id: '3', name: 'Update documentation', status: 'done', priority: 'low' },
  { id: '4', name: 'Fix navigation bug', status: 'in-progress', priority: 'high' },
  { id: '5', name: 'Write unit tests', status: 'todo', priority: 'medium' },
];

function InlineEditingExample() {
  const [data, setData] = React.useState<Task[]>(initialTasks);

  const handleCellUpdate = (rowIndex: number, columnId: string, value: unknown) => {
    setData((prev) => {
      const newData = [...prev];
      newData[rowIndex] = { ...newData[rowIndex], [columnId]: value };
      return newData;
    });
  };

  const editableColumns: ColumnDef<Task, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Task',
      meta: { type: 'text', placeholder: 'Enter task name...' } as EditableCellMeta,
      size: 250,
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
    },
  ];

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Click on any cell to edit. Press Enter to save, Escape to cancel.</p>
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

export const InlineEditing = {
  name: 'Inline Editing',
  render: () => <InlineEditingExample />,
};

// ============================================================================
// Filtering & Search
// ============================================================================

function FilteringAndSearchExample() {
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [departmentFilter, setDepartmentFilter] = React.useState('all');

  const activeFilters: { label: string; value: string; clear: () => void }[] = [];
  if (statusFilter !== 'all') activeFilters.push({ label: `Status: ${statusFilter}`, value: statusFilter, clear: () => setStatusFilter('all') });
  if (roleFilter !== 'all') activeFilters.push({ label: `Role: ${roleFilter}`, value: roleFilter, clear: () => setRoleFilter('all') });
  if (departmentFilter !== 'all') activeFilters.push({ label: `Dept: ${departmentFilter}`, value: departmentFilter, clear: () => setDepartmentFilter('all') });

  const clearAll = () => { setStatusFilter('all'); setRoleFilter('all'); setDepartmentFilter('all'); };

  const filtered = sampleUsers.filter((u) => {
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (departmentFilter !== 'all' && u.department !== departmentFilter) return false;
    return true;
  });

  const filterDropdowns = (
    <>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="h-8 w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
        </SelectContent>
      </Select>
      <Select value={roleFilter} onValueChange={setRoleFilter}>
        <SelectTrigger className="h-8 w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="Admin">Admin</SelectItem>
          <SelectItem value="Manager">Manager</SelectItem>
          <SelectItem value="User">User</SelectItem>
        </SelectContent>
      </Select>
      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
        <SelectTrigger className="h-8 w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          <SelectItem value="Engineering">Engineering</SelectItem>
          <SelectItem value="Design">Design</SelectItem>
          <SelectItem value="Marketing">Marketing</SelectItem>
          <SelectItem value="Sales">Sales</SelectItem>
          <SelectItem value="Product">Product</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Combine search with dropdown filters for precise results. Active filters appear as chips below.
      </p>
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((f) => (
            <Badge key={f.label} variant="secondary" className="gap-1 pr-1">
              {f.label}
              <button
                type="button"
                onClick={f.clear}
                className="ml-0.5 rounded-sm hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearAll}>
            Clear all
          </Button>
        </div>
      )}
      <DataTable
        columns={sortableColumns}
        data={filtered}
        searchKey="name"
        searchPlaceholder="Search by name..."
        showColumnToggle={false}
        toolbarContent={filterDropdowns}
      />
    </div>
  );
}

export const FilteringAndSearch = {
  name: 'Filtering & Search',
  render: () => <FilteringAndSearchExample />,
};

// ============================================================================
// Column Visibility Toggle
// ============================================================================

export const ColumnVisibilityToggle = {
  name: 'Column Visibility Toggle',
  render: () => (
    <DataTable
      columns={sortableColumns}
      data={sampleUsers}
      searchKey="name"
      showColumnToggle
      columnToggleText="Toggle Columns"
    />
  ),
};

// ============================================================================
// Advanced Sorting
// ============================================================================

export const AdvancedSorting = {
  name: 'Advanced Sorting',
  render: () => {
    const columns: ColumnDef<User>[] = [
      { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Name" /> },
      { accessorKey: 'email', header: ({ column }) => <DataTableColumnHeader column={column} title="Email" /> },
      { accessorKey: 'role', header: ({ column }) => <DataTableColumnHeader column={column} title="Role" /> },
      { accessorKey: 'department', header: ({ column }) => <DataTableColumnHeader column={column} title="Department" /> },
      { accessorKey: 'joined', header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" /> },
      { accessorKey: 'status', header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />, cell: ({ row }) => statusBadge(row.getValue('status')) },
    ];

    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Click column headers to cycle through: ascending, descending, and unsorted.</p>
        <DataTable columns={columns} data={sampleUsers} showColumnToggle={false} />
      </div>
    );
  },
};

// ============================================================================
// Export Functionality
// ============================================================================

function ExportExample() {
  const handleExport = (format: string) => {
    const header = ['Name', 'Email', 'Role', 'Department', 'Status'].join(',');
    const rows = sampleUsers.map((u) => [u.name, u.email, u.role, u.department, u.status].join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: `text/${format}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: ColumnDef<User>[] = [
    DataTableSelectColumn<User>(),
    ...sortableColumns,
  ];

  const exportButton = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Export As</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('csv')}>CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('tsv')}>TSV</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <DataTable
      columns={columns}
      data={sampleUsers}
      searchKey="name"
      toolbarContent={exportButton}
    />
  );
}

export const ExportFunctionality = {
  name: 'Export Functionality',
  render: () => <ExportExample />,
};

// ============================================================================
// Drawer
// ============================================================================

function DrawerExample() {
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);

  const columns: ColumnDef<User>[] = [
    { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Name" /> },
    { accessorKey: 'email', header: ({ column }) => <DataTableColumnHeader column={column} title="Email" /> },
    { accessorKey: 'role', header: 'Role' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => statusBadge(row.getValue('status')) },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedUser(row.original)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={sampleUsers} searchKey="name" showColumnToggle={false} />
      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent>
          {selectedUser && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedUser.name}</SheetTitle>
                <SheetDescription>{selectedUser.email}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="text-sm font-medium">{selectedUser.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-0.5">{statusBadge(selectedUser.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="text-sm font-medium">{selectedUser.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="text-sm font-medium">{selectedUser.joined}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button size="sm">
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

export const Drawer = {
  name: 'Drawer',
  render: () => <DrawerExample />,
};

// ============================================================================
// Modal Delete
// ============================================================================

function ModalDeleteExample() {
  const [data, setData] = React.useState(sampleUsers);
  const [deleteUser, setDeleteUser] = React.useState<User | null>(null);

  const handleDelete = () => {
    if (deleteUser) {
      setData((prev) => prev.filter((u) => u.id !== deleteUser.id));
      setDeleteUser(null);
    }
  };

  const columns: ColumnDef<User>[] = [
    { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Name" /> },
    { accessorKey: 'email', header: ({ column }) => <DataTableColumnHeader column={column} title="Email" /> },
    { accessorKey: 'role', header: 'Role' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => statusBadge(row.getValue('status')) },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>Edit user</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteUser(row.original)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete user
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={data} searchKey="name" showColumnToggle={false} />
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteUser?.name}</strong>? This action
              cannot be undone and will permanently remove the user and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const ModalDelete = {
  name: 'Modal Delete',
  render: () => <ModalDeleteExample />,
};

// ============================================================================
// Density
// ============================================================================

function DensityExample() {
  const [density, setDensity] = React.useState<'normal' | 'dense'>('normal');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label className="text-sm">Density</Label>
        <Select value={density} onValueChange={(v) => setDensity(v as 'normal' | 'dense')}>
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal (48px)</SelectItem>
            <SelectItem value="dense">Dense (32px)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs text-muted-foreground">
        {density === 'normal'
          ? 'Normal density (48px): Best for standard data displays with moderate amounts of information. Provides comfortable spacing and readability.'
          : 'Dense density (32px): Ideal for large datasets where maximizing information density is important. Use when displaying many rows or when screen space is limited.'}
      </p>
      <DataTable
        columns={sortableColumns}
        data={sampleUsers}
        searchKey="name"
        compact={density === 'dense'}
      />
    </div>
  );
}

export const Density = {
  name: 'Density',
  render: () => <DensityExample />,
};

// ============================================================================
// Examples
// ============================================================================

function FullFeaturedExample() {
  const [data, setData] = React.useState(sampleUsers);
  const [drawerUser, setDrawerUser] = React.useState<User | null>(null);
  const [deleteUser, setDeleteUser] = React.useState<User | null>(null);
  const [density, setDensity] = React.useState<'normal' | 'dense'>('normal');

  const handleDelete = () => {
    if (deleteUser) {
      setData((prev) => prev.filter((u) => u.id !== deleteUser.id));
      setDeleteUser(null);
    }
  };

  const handleExport = () => {
    const header = ['Name', 'Email', 'Role', 'Department', 'Status'].join(',');
    const rows = data.map((u) => [u.name, u.email, u.role, u.department, u.status].join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: ColumnDef<User>[] = [
    DataTableSelectColumn<User>(),
    { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Name" /> },
    { accessorKey: 'email', header: ({ column }) => <DataTableColumnHeader column={column} title="Email" /> },
    { accessorKey: 'role', header: ({ column }) => <DataTableColumnHeader column={column} title="Role" /> },
    { accessorKey: 'department', header: ({ column }) => <DataTableColumnHeader column={column} title="Department" /> },
    { accessorKey: 'status', header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />, cell: ({ row }) => statusBadge(row.getValue('status')) },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setDrawerUser(row.original)}>
              View details
            </DropdownMenuItem>
            <DropdownMenuItem>Edit user</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteUser(row.original)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Density</Label>
            <Select value={density} onValueChange={(v) => setDensity(v as 'normal' | 'dense')}>
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal (48px)</SelectItem>
                <SelectItem value="dense">Dense (32px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
        <DataTable
          columns={columns}
          data={data}
          searchKey="name"
          searchPlaceholder="Search users..."
          compact={density === 'dense'}
          pageSize={5}
        />
      </div>

      {/* Detail drawer */}
      <Sheet open={!!drawerUser} onOpenChange={(open) => !open && setDrawerUser(null)}>
        <SheetContent>
          {drawerUser && (
            <>
              <SheetHeader>
                <SheetTitle>{drawerUser.name}</SheetTitle>
                <SheetDescription>{drawerUser.email}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="text-sm font-medium">{drawerUser.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-0.5">{statusBadge(drawerUser.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="text-sm font-medium">{drawerUser.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="text-sm font-medium">{drawerUser.joined}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteUser?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const Examples = {
  name: 'Examples',
  render: () => <FullFeaturedExample />,
};

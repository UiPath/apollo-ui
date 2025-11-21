import type { Meta, StoryObj } from "@storybook/react-vite";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "./badge";
import { Button } from "./button";
import { DataTable, DataTableColumnHeader, DataTableSelectColumn } from "./data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const meta = {
  title: "Design System/Data Display/Data Table",
  component: DataTable,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data types
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "pending";
};

const sampleUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "Admin",
    status: "active",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "User",
    status: "active",
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@example.com",
    role: "User",
    status: "inactive",
  },
  {
    id: "4",
    name: "Alice Williams",
    email: "alice@example.com",
    role: "Manager",
    status: "active",
  },
  {
    id: "5",
    name: "Charlie Brown",
    email: "charlie@example.com",
    role: "User",
    status: "pending",
  },
  {
    id: "6",
    name: "Diana Prince",
    email: "diana@example.com",
    role: "Admin",
    status: "active",
  },
  {
    id: "7",
    name: "Eve Anderson",
    email: "eve@example.com",
    role: "User",
    status: "inactive",
  },
  {
    id: "8",
    name: "Frank Miller",
    email: "frank@example.com",
    role: "Manager",
    status: "active",
  },
  {
    id: "9",
    name: "Grace Lee",
    email: "grace@example.com",
    role: "User",
    status: "active",
  },
  {
    id: "10",
    name: "Henry Davis",
    email: "henry@example.com",
    role: "User",
    status: "pending",
  },
  {
    id: "11",
    name: "Ivy Wilson",
    email: "ivy@example.com",
    role: "Admin",
    status: "active",
  },
  {
    id: "12",
    name: "Jack Taylor",
    email: "jack@example.com",
    role: "User",
    status: "inactive",
  },
];

const basicColumns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={
            status === "active" ? "default" : status === "inactive" ? "secondary" : "outline"
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
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
  },
  {
    accessorKey: "role",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={
            status === "active" ? "default" : status === "inactive" ? "secondary" : "outline"
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
    id: "actions",
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

export const Default: Story = {
  render: () => <DataTable columns={basicColumns} data={sampleUsers} />,
};

export const WithSearch: Story = {
  render: () => (
    <DataTable
      columns={basicColumns}
      data={sampleUsers}
      searchKey="name"
      searchPlaceholder="Search by name..."
    />
  ),
};

export const Sortable: Story = {
  render: () => (
    <DataTable
      columns={sortableColumns}
      data={sampleUsers}
      searchKey="name"
      searchPlaceholder="Search by name..."
    />
  ),
};

export const WithSelection: Story = {
  render: () => (
    <DataTable
      columns={selectableColumns}
      data={sampleUsers}
      searchKey="name"
      searchPlaceholder="Search by name..."
    />
  ),
};

export const NoPagination: Story = {
  render: () => (
    <DataTable columns={basicColumns} data={sampleUsers.slice(0, 5)} showPagination={false} />
  ),
};

export const NoColumnToggle: Story = {
  render: () => (
    <DataTable
      columns={basicColumns}
      data={sampleUsers}
      showColumnToggle={false}
      searchKey="name"
    />
  ),
};

export const CustomPageSize: Story = {
  render: () => (
    <DataTable columns={sortableColumns} data={sampleUsers} searchKey="name" pageSize={5} />
  ),
};

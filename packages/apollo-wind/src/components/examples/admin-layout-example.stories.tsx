import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Globe, Code, Users, RefreshCw, HelpCircle, MoreHorizontal } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AdminLayout,
  AdminHeader,
  AdminHeaderActions,
  AdminContent,
  AdminSidebar,
  AdminSidebarHeader,
  AdminSidebarNav,
  AdminMain,
  AdminPageHeader,
  AdminToolbar,
  AdminFilter,
  AdminTable,
  AdminPagination,
  DataTableColumnHeader,
  DataTableSelectColumn,
} from "./admin-layout-example";

const meta = {
  title: "Examples/Admin Layout",
  component: AdminLayout,
} satisfies Meta<typeof AdminLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data
const tenants = [
  { id: "1", name: "Maestro", type: "tenant" },
  { id: "2", name: "Staging", type: "tenant" },
  { id: "3", name: "ao", type: "tenant" },
  { id: "4", name: "Development", type: "service", badge: "Canary Environment" },
  { id: "5", name: "DefaultTenant", type: "tenant" },
  { id: "6", name: "optimize", type: "service" },
];

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  type: "user" | "group";
};

const users: User[] = [
  { id: "1", name: "Finance-test", email: "", role: "Test-role-viewer", type: "group" },
  {
    id: "2",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Tenant Administrator",
    type: "user",
  },
];

function AdminPageDemo() {
  const [selectedTenant, setSelectedTenant] = React.useState("1");
  const [activeTab, setActiveTab] = React.useState("assignments");
  const [nameFilter, setNameFilter] = React.useState("all");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const navItems = tenants.map((t) => ({
    id: t.id,
    label: t.name,
    icon: t.type === "tenant" ? <Globe className="h-4 w-4" /> : <Code className="h-4 w-4" />,
    badge: t.badge ? (
      <Badge variant="default" className="ml-auto text-[10px]">
        {t.badge}
      </Badge>
    ) : undefined,
  }));

  const columns: ColumnDef<User>[] = [
    DataTableSelectColumn<User>(),
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      cell: ({ row }) => row.original.email || "—",
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Roles">
          <HelpCircle className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
        </DataTableColumnHeader>
      ),
      cell: ({ row }) => row.original.role,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => console.log("edit", row.original)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log("remove", row.original)}>
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <AdminLayout className="h-[700px]">
      <AdminHeader
        logo={
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                <rect x="2" y="2" width="8" height="8" rx="1" fill="currentColor" />
                <rect x="2" y="14" width="8" height="8" rx="1" fill="currentColor" />
                <rect x="14" y="2" width="8" height="8" rx="1" fill="currentColor" />
                <rect x="14" y="14" width="8" height="8" rx="1" fill="currentColor" />
              </svg>
            </div>
          </div>
        }
        title="Administration"
      >
        <AdminHeaderActions notifications={1} />
      </AdminHeader>

      <AdminContent>
        <AdminSidebar width={260}>
          <div className="border-b px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
              POPoC
            </div>
          </div>
          <AdminSidebarHeader title="Tenants" onSearch={() => undefined} onAdd={() => undefined} />
          <AdminSidebarNav
            items={navItems}
            selectedId={selectedTenant}
            onSelect={setSelectedTenant}
          />
        </AdminSidebar>

        <AdminMain>
          <AdminPageHeader
            title="Manage access"
            breadcrumb={[
              { label: "POPoC" },
              { label: "DefaultTenant" },
              { label: "Manage access" },
            ]}
            tabs={[
              { value: "assignments", label: "Role assignments" },
              { value: "roles", label: "Roles" },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            actions={
              <>
                <Button variant="link">Check access</Button>
                <Button>Assign role</Button>
              </>
            }
          />

          <AdminToolbar
            actions={
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <RefreshCw className="h-4 w-4" />
              </Button>
            }
          >
            <AdminFilter
              label="Name"
              value={nameFilter}
              options={[
                { value: "all", label: "All" },
                { value: "users", label: "Users" },
                { value: "groups", label: "Groups" },
              ]}
              onValueChange={setNameFilter}
            />
            <AdminFilter
              label="Roles"
              value={roleFilter}
              options={[
                { value: "all", label: "All" },
                { value: "admin", label: "Administrator" },
                { value: "viewer", label: "Viewer" },
              ]}
              onValueChange={setRoleFilter}
            />
          </AdminToolbar>

          <div className="flex-1 overflow-auto px-6">
            <AdminTable columns={columns} data={users} compact />
          </div>

          <AdminPagination
            total={users.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </AdminMain>
      </AdminContent>
    </AdminLayout>
  );
}

export const Default: Story = {
  render: () => <AdminPageDemo />,
};

// Simple settings page
function SettingsPageDemo() {
  const [selectedSection, setSelectedSection] = React.useState("general");

  const sections = [
    { id: "general", label: "General", icon: <Globe className="h-4 w-4" /> },
    { id: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
    { id: "security", label: "Security", icon: <Code className="h-4 w-4" /> },
  ];

  return (
    <AdminLayout className="h-[500px]">
      <AdminHeader title="Settings">
        <AdminHeaderActions />
      </AdminHeader>
      <AdminContent>
        <AdminSidebar width={220}>
          <AdminSidebarNav
            items={sections}
            selectedId={selectedSection}
            onSelect={setSelectedSection}
          />
        </AdminSidebar>
        <AdminMain>
          <AdminPageHeader title="General Settings" />
          <div className="flex-1 p-6">
            <p className="text-muted-foreground">Settings content goes here.</p>
          </div>
        </AdminMain>
      </AdminContent>
    </AdminLayout>
  );
}

export const SettingsPage: Story = {
  render: () => <SettingsPageDemo />,
};

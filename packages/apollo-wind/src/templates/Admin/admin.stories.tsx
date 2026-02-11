import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ChevronsLeft,
  ChevronsRight,
  Code,
  Download,
  Filter,
  Globe,
  HelpCircle,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Upload,
  Users,
} from 'lucide-react';
import * as React from 'react';
import { MaestroHeader } from '@/components/custom/global-header';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DataTable,
  DataTableColumnHeader,
  DataTableSelectColumn,
} from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ViewportGuard } from '@/components/ui/viewport-guard';
import { fontFamily } from '@/foundation/Future/typography';
import { cn } from '@/lib';

// ============================================================================
// Layout primitives (themed with Future tokens)
// ============================================================================

function AdminLayout({
  className,
  theme = 'dark',
  children,
}: {
  className?: string;
  theme?: string;
  children: React.ReactNode;
}) {
  return (
    <ViewportGuard
      minWidth={769}
      message="This view is not available at this screen size. Please use a larger viewport."
    >
      <div
        className={cn(
          theme === 'legacy-dark'
            ? 'legacy-dark'
            : theme === 'legacy-light'
              ? 'legacy-light'
              : theme === 'light'
                ? 'future-light'
                : 'future-dark',
          'flex h-screen w-full flex-col overflow-hidden bg-future-surface text-foreground',
          className
        )}
        style={{ fontFamily: fontFamily.base }}
      >
        {children}
      </div>
    </ViewportGuard>
  );
}

function AdminContent({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 overflow-hidden">{children}</div>;
}

function AdminSidebar({ children, width = 260 }: { children: React.ReactNode; width?: number }) {
  return (
    <div
      className="flex flex-col border-r border-future-border-subtle bg-future-surface"
      style={{ width }}
    >
      {children}
    </div>
  );
}

function AdminSidebarHeader({
  title,
  onSearch,
  onAdd,
}: {
  title: string;
  onSearch?: () => void;
  onAdd?: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-future-border-subtle px-4 py-3">
      <span className="text-sm font-medium text-future-foreground">{title}</span>
      <div className="flex items-center gap-1">
        {onSearch && (
          <button
            className="flex h-7 w-7 items-center justify-center rounded-md text-future-foreground-muted transition-colors hover:bg-future-surface-hover hover:text-future-foreground"
            onClick={onSearch}
          >
            <Search className="h-4 w-4" />
          </button>
        )}
        {onAdd && (
          <button
            className="flex h-7 w-7 items-center justify-center rounded-md text-future-foreground-muted transition-colors hover:bg-future-surface-hover hover:text-future-foreground"
            onClick={onAdd}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

interface AdminNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

function AdminSidebarNav({
  items,
  selectedId,
  onSelect,
}: {
  items: AdminNavItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <ScrollArea className="flex-1">
      <nav className="flex flex-col gap-0.5 p-2">
        {items.map((item) => (
          <button
            key={item.id}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
              selectedId === item.id
                ? 'bg-future-accent-subtle text-future-accent-foreground'
                : 'text-future-foreground-muted hover:bg-future-surface-hover hover:text-future-foreground'
            )}
            onClick={() => onSelect?.(item.id)}
          >
            {item.icon}
            <span className="flex-1 truncate text-left">{item.label}</span>
            {item.badge}
          </button>
        ))}
      </nav>
    </ScrollArea>
  );
}

function AdminMain({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col overflow-hidden">{children}</div>;
}

interface BreadcrumbItemType {
  label: string;
  href?: string;
}

function AdminBreadcrumb({ items }: { items: BreadcrumbItemType[] }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <React.Fragment key={item.label}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {index === items.length - 1 ? (
                <BreadcrumbPage className="text-future-foreground">{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  href={item.href || '#'}
                  className="text-future-foreground-muted hover:text-future-foreground"
                >
                  {item.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function AdminPageHeader({
  title,
  breadcrumb,
  actions,
  tabs,
  activeTab,
  onTabChange,
}: {
  title: string;
  breadcrumb?: BreadcrumbItemType[];
  actions?: React.ReactNode;
  tabs?: { value: string; label: string }[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
}) {
  return (
    <div className="border-b border-future-border-subtle px-6 py-4">
      {breadcrumb && (
        <div className="mb-2">
          <AdminBreadcrumb items={breadcrumb} />
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-future-foreground">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {tabs && (
        <div className="mt-4 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              className={`px-4 pb-2 pt-1 text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? 'border-b-2 border-future-accent text-future-foreground'
                  : 'text-future-foreground-muted hover:text-future-foreground'
              }`}
              onClick={() => onTabChange?.(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminToolbar({
  children,
  actions,
}: {
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-future-border-subtle px-6 py-3">
      <div className="flex items-center gap-3">{children}</div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}

function AdminFilter({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onValueChange?: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-future-foreground-muted">{label}:</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-transparent px-1 font-medium text-future-foreground shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-future-border bg-future-surface-overlay text-future-foreground">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function AdminPagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const getPageNumbers = () => {
    const pages: number[] = [];
    const delta = 1;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        pages.push(i);
      }
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between border-t border-future-border-subtle px-6 py-3">
      <span className="text-sm text-future-foreground-muted">
        {start} - {end} / {total}
      </span>
      <div className="flex items-center gap-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md text-future-foreground-muted transition-colors hover:bg-future-surface-hover hover:text-future-foreground disabled:opacity-50"
                disabled={page === 1}
                onClick={() => onPageChange?.(1)}
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
            </PaginationItem>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => page > 1 && onPageChange?.(page - 1)}
                className={cn(
                  'text-future-foreground-muted hover:bg-future-surface-hover hover:text-future-foreground',
                  page === 1 && 'pointer-events-none opacity-50'
                )}
              />
            </PaginationItem>

            {pageNumbers.map((pageNum, index) => {
              const prevPage = pageNumbers[index - 1];
              const showEllipsis = prevPage && pageNum - prevPage > 1;
              return (
                <React.Fragment key={pageNum}>
                  {showEllipsis && (
                    <PaginationItem>
                      <PaginationEllipsis className="text-future-foreground-muted" />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => onPageChange?.(pageNum)}
                      isActive={page === pageNum}
                      className={cn(
                        page === pageNum
                          ? 'bg-future-accent text-future-foreground-on-accent'
                          : 'text-future-foreground-muted hover:bg-future-surface-hover hover:text-future-foreground'
                      )}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                </React.Fragment>
              );
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => page < totalPages && onPageChange?.(page + 1)}
                className={cn(
                  'text-future-foreground-muted hover:bg-future-surface-hover hover:text-future-foreground',
                  page === totalPages && 'pointer-events-none opacity-50'
                )}
              />
            </PaginationItem>
            <PaginationItem>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md text-future-foreground-muted transition-colors hover:bg-future-surface-hover hover:text-future-foreground disabled:opacity-50"
                disabled={page === totalPages}
                onClick={() => onPageChange?.(totalPages)}
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        {onPageSizeChange && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-future-foreground-muted">Items</span>
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger className="h-8 w-16 border-future-border bg-future-surface-overlay text-future-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-future-border bg-future-surface-overlay text-future-foreground">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Storybook meta
// ============================================================================

const meta = {
  title: 'Templates/Admin',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Admin menu nav (slide-out drawer)
// ============================================================================

function AdminMenuNav() {
  const menuItems = [
    { label: 'Manage Access', icon: <Users className="h-4 w-4 shrink-0" /> },
    { label: 'Data Management', icon: <Globe className="h-4 w-4 shrink-0" /> },
    { label: 'Settings', icon: <HelpCircle className="h-4 w-4 shrink-0" /> },
    { label: 'Audit Logs', icon: <RefreshCw className="h-4 w-4 shrink-0" /> },
    { label: 'Integrations', icon: <Code className="h-4 w-4 shrink-0" /> },
  ];

  return (
    <nav className="flex flex-1 flex-col overflow-y-auto px-2 pt-2">
      <div className="flex flex-col gap-1">
        {menuItems.map((item, i) => (
          <button
            key={i}
            className="flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-future-foreground-muted transition-colors hover:bg-future-surface-hover hover:text-future-foreground"
          >
            {item.icon}
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// ============================================================================
// Sample data
// ============================================================================

const tenants = [
  { id: '1', name: 'Maestro', type: 'tenant' },
  { id: '2', name: 'Staging', type: 'tenant' },
  { id: '3', name: 'ao', type: 'tenant' },
  { id: '4', name: 'Development', type: 'service', badge: 'Canary Environment' },
  { id: '5', name: 'DefaultTenant', type: 'tenant' },
  { id: '6', name: 'optimize', type: 'service' },
];

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  type: 'user' | 'group';
};

const users: UserRow[] = [
  { id: '1', name: 'Finance-test', email: '', role: 'Test-role-viewer', type: 'group' },
  {
    id: '2',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Tenant Administrator',
    type: 'user',
  },
  { id: '3', name: 'Engineering', email: '', role: 'Automation Developer', type: 'group' },
  {
    id: '4',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'Tenant Administrator',
    type: 'user',
  },
  { id: '5', name: 'QA Team', email: '', role: 'Test-role-viewer', type: 'group' },
  {
    id: '6',
    name: 'Carlos Rivera',
    email: 'carlos.rivera@example.com',
    role: 'Automation Developer',
    type: 'user',
  },
  { id: '7', name: 'DevOps', email: '', role: 'Tenant Administrator', type: 'group' },
  {
    id: '8',
    name: 'Aisha Patel',
    email: 'aisha.patel@example.com',
    role: 'Automation User',
    type: 'user',
  },
  { id: '9', name: 'Marketing', email: '', role: 'Viewer', type: 'group' },
  {
    id: '10',
    name: 'Liam Chen',
    email: 'liam.chen@example.com',
    role: 'Automation Developer',
    type: 'user',
  },
  { id: '11', name: 'Support Tier-1', email: '', role: 'Viewer', type: 'group' },
  {
    id: '12',
    name: 'Sofia Müller',
    email: 'sofia.muller@example.com',
    role: 'Tenant Administrator',
    type: 'user',
  },
  { id: '13', name: 'Data Science', email: '', role: 'Automation Developer', type: 'group' },
  {
    id: '14',
    name: 'Raj Kapoor',
    email: 'raj.kapoor@example.com',
    role: 'Automation User',
    type: 'user',
  },
  { id: '15', name: 'HR Operations', email: '', role: 'Viewer', type: 'group' },
  {
    id: '16',
    name: 'Emily Watson',
    email: 'emily.watson@example.com',
    role: 'Tenant Administrator',
    type: 'user',
  },
  { id: '17', name: 'Platform Team', email: '', role: 'Automation Developer', type: 'group' },
  {
    id: '18',
    name: 'Tomás García',
    email: 'tomas.garcia@example.com',
    role: 'Automation User',
    type: 'user',
  },
  { id: '19', name: 'Security', email: '', role: 'Tenant Administrator', type: 'group' },
  {
    id: '20',
    name: 'Yuki Tanaka',
    email: 'yuki.tanaka@example.com',
    role: 'Automation Developer',
    type: 'user',
  },
  { id: '21', name: 'Sales Ops', email: '', role: 'Viewer', type: 'group' },
  {
    id: '22',
    name: 'Alex Novak',
    email: 'alex.novak@example.com',
    role: 'Automation User',
    type: 'user',
  },
  { id: '23', name: 'Compliance', email: '', role: 'Test-role-viewer', type: 'group' },
  {
    id: '24',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    role: 'Tenant Administrator',
    type: 'user',
  },
  { id: '25', name: 'Product Team', email: '', role: 'Automation Developer', type: 'group' },
  {
    id: '26',
    name: 'Marcus Johnson',
    email: 'marcus.johnson@example.com',
    role: 'Automation User',
    type: 'user',
  },
  { id: '27', name: 'IT Infrastructure', email: '', role: 'Tenant Administrator', type: 'group' },
  { id: '28', name: 'Hannah Lee', email: 'hannah.lee@example.com', role: 'Viewer', type: 'user' },
  { id: '29', name: 'Customer Success', email: '', role: 'Viewer', type: 'group' },
  {
    id: '30',
    name: 'David Kim',
    email: 'david.kim@example.com',
    role: 'Automation Developer',
    type: 'user',
  },
  { id: '31', name: 'Analytics', email: '', role: 'Automation User', type: 'group' },
  {
    id: '32',
    name: 'Olivia Brown',
    email: 'olivia.brown@example.com',
    role: 'Tenant Administrator',
    type: 'user',
  },
  { id: '33', name: 'Legal', email: '', role: 'Viewer', type: 'group' },
  {
    id: '34',
    name: 'Nathan Wright',
    email: 'nathan.wright@example.com',
    role: 'Automation User',
    type: 'user',
  },
  { id: '35', name: 'Release Mgmt', email: '', role: 'Automation Developer', type: 'group' },
  {
    id: '36',
    name: 'Fatima Al-Hassan',
    email: 'fatima.alhassan@example.com',
    role: 'Tenant Administrator',
    type: 'user',
  },
  { id: '37', name: 'Operations', email: '', role: 'Automation User', type: 'group' },
  {
    id: '38',
    name: 'Lucas Martin',
    email: 'lucas.martin@example.com',
    role: 'Automation Developer',
    type: 'user',
  },
  { id: '39', name: 'Design Systems', email: '', role: 'Viewer', type: 'group' },
  {
    id: '40',
    name: 'Isabella Davis',
    email: 'isabella.davis@example.com',
    role: 'Automation User',
    type: 'user',
  },
  { id: '41', name: 'Cloud Infra', email: '', role: 'Tenant Administrator', type: 'group' },
  {
    id: '42',
    name: 'Ethan Taylor',
    email: 'ethan.taylor@example.com',
    role: 'Automation Developer',
    type: 'user',
  },
  { id: '43', name: 'Procurement', email: '', role: 'Viewer', type: 'group' },
  {
    id: '44',
    name: 'Mia Anderson',
    email: 'mia.anderson@example.com',
    role: 'Tenant Administrator',
    type: 'user',
  },
  { id: '45', name: 'R&D Lab', email: '', role: 'Automation Developer', type: 'group' },
  {
    id: '46',
    name: 'Oscar Petrov',
    email: 'oscar.petrov@example.com',
    role: 'Automation User',
    type: 'user',
  },
  { id: '47', name: 'Executive Office', email: '', role: 'Viewer', type: 'group' },
  {
    id: '48',
    name: 'Grace Wilson',
    email: 'grace.wilson@example.com',
    role: 'Tenant Administrator',
    type: 'user',
  },
  {
    id: '49',
    name: 'Partner Integrations',
    email: '',
    role: 'Automation Developer',
    type: 'group',
  },
  {
    id: '50',
    name: 'Daniel Okafor',
    email: 'daniel.okafor@example.com',
    role: 'Automation User',
    type: 'user',
  },
];

// ============================================================================
// Admin page demo
// ============================================================================

function AdminPageDemo({ theme }: { theme: string }) {
  const [selectedTenant, setSelectedTenant] = React.useState('1');
  const [activeTab, setActiveTab] = React.useState('assignments');
  const [nameFilter, setNameFilter] = React.useState('all');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);

  const navItems: AdminNavItem[] = tenants.map((t) => ({
    id: t.id,
    label: t.name,
    icon: t.type === 'tenant' ? <Globe className="h-4 w-4" /> : <Code className="h-4 w-4" />,
    badge: t.badge ? (
      <Badge
        variant="default"
        className="ml-auto bg-future-accent-subtle text-[10px] text-future-accent-foreground"
      >
        {t.badge}
      </Badge>
    ) : undefined,
  }));

  const themeClass =
    theme === 'legacy-dark'
      ? 'legacy-dark'
      : theme === 'legacy-light'
        ? 'legacy-light'
        : theme === 'light'
          ? 'future-light'
          : 'future-dark';

  const columns: ColumnDef<UserRow>[] = [
    DataTableSelectColumn<UserRow>(),
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-future-foreground-muted" />
          <span className="text-future-foreground">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      cell: ({ row }) => (
        <span className="text-future-foreground-muted">{row.original.email || '—'}</span>
      ),
    },
    {
      accessorKey: 'role',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Roles">
          <HelpCircle className="ml-1 h-3.5 w-3.5 text-future-foreground-muted" />
        </DataTableColumnHeader>
      ),
      cell: ({ row }) => <span className="text-future-foreground-muted">{row.original.role}</span>,
    },
    {
      id: 'actions',
      cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-future-foreground-muted transition-colors hover:bg-future-surface-hover hover:text-future-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className={cn(themeClass, 'border-future-border bg-future-surface-overlay')}
          >
            <DropdownMenuItem className="text-future-foreground-muted focus:bg-future-surface-hover focus:text-future-foreground">
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-future-foreground-muted focus:bg-future-surface-hover focus:text-future-foreground">
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <AdminLayout theme={theme}>
      {/* Global header */}
      <MaestroHeader title="Administration" theme={theme} menuContent={<AdminMenuNav />} />

      <AdminContent>
        {/* Sidebar */}
        <AdminSidebar width={260}>
          <div className="flex items-center gap-2 border-b border-future-border-subtle px-4 py-3 text-sm font-medium text-future-foreground">
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
          <AdminSidebarHeader title="Tenants" onSearch={() => undefined} onAdd={() => undefined} />
          <AdminSidebarNav
            items={navItems}
            selectedId={selectedTenant}
            onSelect={setSelectedTenant}
          />
        </AdminSidebar>

        {/* Main content */}
        <AdminMain>
          <AdminPageHeader
            title="Manage access"
            breadcrumb={[
              { label: 'POPoC' },
              { label: 'DefaultTenant' },
              { label: 'Manage access' },
            ]}
            tabs={[
              { value: 'assignments', label: 'Role assignments' },
              { value: 'roles', label: 'Roles' },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            actions={
              <>
                <button className="px-3 py-1.5 text-sm font-medium text-future-accent-foreground transition-colors hover:text-future-foreground">
                  Check access
                </button>
                <button className="rounded-lg bg-future-accent px-4 py-1.5 text-sm font-medium text-future-foreground-on-accent transition-colors hover:bg-future-accent/90">
                  Assign role
                </button>
              </>
            }
          />

          <AdminToolbar
            actions={
              <button className="flex h-8 w-8 items-center justify-center rounded-md text-future-foreground-muted transition-colors hover:bg-future-surface-hover hover:text-future-foreground">
                <RefreshCw className="h-4 w-4" />
              </button>
            }
          >
            <AdminFilter
              label="Name"
              value={nameFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'users', label: 'Users' },
                { value: 'groups', label: 'Groups' },
              ]}
              onValueChange={setNameFilter}
            />
            <AdminFilter
              label="Roles"
              value={roleFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'admin', label: 'Administrator' },
                { value: 'viewer', label: 'Viewer' },
              ]}
              onValueChange={setRoleFilter}
            />
          </AdminToolbar>

          <div className="flex-1 overflow-auto px-6">
            <DataTable columns={columns} data={users} compact />
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

// ============================================================================
// Stories
// ============================================================================

export const Landing: Story = {
  name: 'Landing',
  render: (_, { globals }) => {
    return <AdminPageDemo theme={globals.futureTheme || 'dark'} />;
  },
};

// ============================================================================
// Data Management demo
// ============================================================================

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
}

const products: Product[] = [
  {
    id: '1',
    name: 'Wireless Headphones',
    sku: 'WH-001',
    category: 'Electronics',
    price: 99.99,
    stock: 150,
    status: 'active',
    createdAt: '2026-01-10',
  },
  {
    id: '2',
    name: 'USB-C Cable',
    sku: 'UC-002',
    category: 'Accessories',
    price: 12.99,
    stock: 500,
    status: 'active',
    createdAt: '2026-01-09',
  },
  {
    id: '3',
    name: 'Laptop Stand',
    sku: 'LS-003',
    category: 'Accessories',
    price: 49.99,
    stock: 75,
    status: 'active',
    createdAt: '2026-01-08',
  },
  {
    id: '4',
    name: 'Mechanical Keyboard',
    sku: 'MK-004',
    category: 'Electronics',
    price: 149.99,
    stock: 0,
    status: 'draft',
    createdAt: '2026-01-07',
  },
  {
    id: '5',
    name: 'Monitor Light Bar',
    sku: 'ML-005',
    category: 'Electronics',
    price: 59.99,
    stock: 200,
    status: 'active',
    createdAt: '2026-01-06',
  },
  {
    id: '6',
    name: 'Webcam HD',
    sku: 'WC-006',
    category: 'Electronics',
    price: 79.99,
    stock: 45,
    status: 'active',
    createdAt: '2026-01-05',
  },
  {
    id: '7',
    name: 'Mouse Pad XL',
    sku: 'MP-007',
    category: 'Accessories',
    price: 24.99,
    stock: 300,
    status: 'active',
    createdAt: '2026-01-04',
  },
  {
    id: '8',
    name: 'Phone Holder',
    sku: 'PH-008',
    category: 'Accessories',
    price: 19.99,
    stock: 0,
    status: 'archived',
    createdAt: '2026-01-03',
  },
  {
    id: '9',
    name: 'Bluetooth Speaker',
    sku: 'BS-009',
    category: 'Electronics',
    price: 39.99,
    stock: 120,
    status: 'active',
    createdAt: '2026-01-02',
  },
  {
    id: '10',
    name: 'Screen Protector',
    sku: 'SP-010',
    category: 'Accessories',
    price: 9.99,
    stock: 1000,
    status: 'active',
    createdAt: '2026-01-01',
  },
  {
    id: '11',
    name: 'Ergonomic Mouse',
    sku: 'EM-011',
    category: 'Electronics',
    price: 69.99,
    stock: 85,
    status: 'active',
    createdAt: '2025-12-31',
  },
  {
    id: '12',
    name: 'HDMI Adapter',
    sku: 'HA-012',
    category: 'Accessories',
    price: 15.99,
    stock: 420,
    status: 'active',
    createdAt: '2025-12-30',
  },
  {
    id: '13',
    name: 'Portable SSD 1TB',
    sku: 'PS-013',
    category: 'Storage',
    price: 129.99,
    stock: 60,
    status: 'active',
    createdAt: '2025-12-29',
  },
  {
    id: '14',
    name: 'USB Hub 7-Port',
    sku: 'UH-014',
    category: 'Accessories',
    price: 34.99,
    stock: 190,
    status: 'active',
    createdAt: '2025-12-28',
  },
  {
    id: '15',
    name: 'Noise Cancelling Mic',
    sku: 'NM-015',
    category: 'Electronics',
    price: 89.99,
    stock: 0,
    status: 'draft',
    createdAt: '2025-12-27',
  },
  {
    id: '16',
    name: 'Desk Organizer',
    sku: 'DO-016',
    category: 'Accessories',
    price: 29.99,
    stock: 350,
    status: 'active',
    createdAt: '2025-12-26',
  },
  {
    id: '17',
    name: 'Wireless Charger',
    sku: 'WC-017',
    category: 'Electronics',
    price: 44.99,
    stock: 220,
    status: 'active',
    createdAt: '2025-12-25',
  },
  {
    id: '18',
    name: 'Cable Management Kit',
    sku: 'CM-018',
    category: 'Accessories',
    price: 18.99,
    stock: 600,
    status: 'active',
    createdAt: '2025-12-24',
  },
  {
    id: '19',
    name: '4K Monitor 27"',
    sku: 'MN-019',
    category: 'Electronics',
    price: 449.99,
    stock: 25,
    status: 'active',
    createdAt: '2025-12-23',
  },
  {
    id: '20',
    name: 'Wrist Rest Gel',
    sku: 'WR-020',
    category: 'Accessories',
    price: 14.99,
    stock: 0,
    status: 'archived',
    createdAt: '2025-12-22',
  },
  {
    id: '21',
    name: 'Smart Power Strip',
    sku: 'SP-021',
    category: 'Electronics',
    price: 39.99,
    stock: 175,
    status: 'active',
    createdAt: '2025-12-21',
  },
  {
    id: '22',
    name: 'Document Scanner',
    sku: 'DS-022',
    category: 'Electronics',
    price: 199.99,
    stock: 30,
    status: 'active',
    createdAt: '2025-12-20',
  },
  {
    id: '23',
    name: 'Privacy Screen Filter',
    sku: 'PF-023',
    category: 'Accessories',
    price: 42.99,
    stock: 95,
    status: 'active',
    createdAt: '2025-12-19',
  },
  {
    id: '24',
    name: 'USB Microphone',
    sku: 'UM-024',
    category: 'Electronics',
    price: 119.99,
    stock: 0,
    status: 'draft',
    createdAt: '2025-12-18',
  },
  {
    id: '25',
    name: 'Portable Monitor 15"',
    sku: 'PM-025',
    category: 'Electronics',
    price: 279.99,
    stock: 40,
    status: 'active',
    createdAt: '2025-12-17',
  },
  {
    id: '26',
    name: 'Ethernet Cable Cat6',
    sku: 'EC-026',
    category: 'Networking',
    price: 8.99,
    stock: 800,
    status: 'active',
    createdAt: '2025-12-16',
  },
  {
    id: '27',
    name: 'Wi-Fi 6 Router',
    sku: 'WR-027',
    category: 'Networking',
    price: 189.99,
    stock: 55,
    status: 'active',
    createdAt: '2025-12-15',
  },
  {
    id: '28',
    name: 'Webcam Ring Light',
    sku: 'RL-028',
    category: 'Accessories',
    price: 22.99,
    stock: 310,
    status: 'active',
    createdAt: '2025-12-14',
  },
  {
    id: '29',
    name: 'Thunderbolt Dock',
    sku: 'TD-029',
    category: 'Electronics',
    price: 249.99,
    stock: 15,
    status: 'active',
    createdAt: '2025-12-13',
  },
  {
    id: '30',
    name: 'Laptop Sleeve 14"',
    sku: 'LS-030',
    category: 'Accessories',
    price: 27.99,
    stock: 200,
    status: 'active',
    createdAt: '2025-12-12',
  },
  {
    id: '31',
    name: 'NVMe SSD 2TB',
    sku: 'NS-031',
    category: 'Storage',
    price: 179.99,
    stock: 70,
    status: 'active',
    createdAt: '2025-12-11',
  },
  {
    id: '32',
    name: 'Keyboard Cover',
    sku: 'KC-032',
    category: 'Accessories',
    price: 11.99,
    stock: 0,
    status: 'archived',
    createdAt: '2025-12-10',
  },
  {
    id: '33',
    name: 'Standing Desk Mat',
    sku: 'SM-033',
    category: 'Accessories',
    price: 54.99,
    stock: 130,
    status: 'active',
    createdAt: '2025-12-09',
  },
  {
    id: '34',
    name: 'USB Flash Drive 128GB',
    sku: 'UF-034',
    category: 'Storage',
    price: 16.99,
    stock: 450,
    status: 'active',
    createdAt: '2025-12-08',
  },
  {
    id: '35',
    name: 'Mesh Wi-Fi System',
    sku: 'MW-035',
    category: 'Networking',
    price: 299.99,
    stock: 20,
    status: 'active',
    createdAt: '2025-12-07',
  },
  {
    id: '36',
    name: 'Presentation Clicker',
    sku: 'PC-036',
    category: 'Electronics',
    price: 29.99,
    stock: 180,
    status: 'active',
    createdAt: '2025-12-06',
  },
  {
    id: '37',
    name: 'Monitor Arm Dual',
    sku: 'MA-037',
    category: 'Accessories',
    price: 79.99,
    stock: 65,
    status: 'active',
    createdAt: '2025-12-05',
  },
  {
    id: '38',
    name: 'Graphics Tablet',
    sku: 'GT-038',
    category: 'Electronics',
    price: 349.99,
    stock: 0,
    status: 'draft',
    createdAt: '2025-12-04',
  },
  {
    id: '39',
    name: 'MicroSD Card 256GB',
    sku: 'MC-039',
    category: 'Storage',
    price: 24.99,
    stock: 550,
    status: 'active',
    createdAt: '2025-12-03',
  },
  {
    id: '40',
    name: 'Surge Protector',
    sku: 'SP-040',
    category: 'Electronics',
    price: 35.99,
    stock: 230,
    status: 'active',
    createdAt: '2025-12-02',
  },
  {
    id: '41',
    name: 'Network Switch 8-Port',
    sku: 'NS-041',
    category: 'Networking',
    price: 49.99,
    stock: 90,
    status: 'active',
    createdAt: '2025-12-01',
  },
  {
    id: '42',
    name: 'Trackpad Wireless',
    sku: 'TW-042',
    category: 'Electronics',
    price: 79.99,
    stock: 105,
    status: 'active',
    createdAt: '2025-11-30',
  },
  {
    id: '43',
    name: 'Display Cleaning Kit',
    sku: 'DC-043',
    category: 'Accessories',
    price: 9.99,
    stock: 700,
    status: 'active',
    createdAt: '2025-11-29',
  },
  {
    id: '44',
    name: 'External Blu-ray Drive',
    sku: 'BD-044',
    category: 'Storage',
    price: 89.99,
    stock: 35,
    status: 'active',
    createdAt: '2025-11-28',
  },
  {
    id: '45',
    name: 'PoE Injector',
    sku: 'PI-045',
    category: 'Networking',
    price: 19.99,
    stock: 160,
    status: 'active',
    createdAt: '2025-11-27',
  },
  {
    id: '46',
    name: 'Webcam Privacy Cover',
    sku: 'WP-046',
    category: 'Accessories',
    price: 5.99,
    stock: 0,
    status: 'archived',
    createdAt: '2025-11-26',
  },
  {
    id: '47',
    name: 'Docking Station USB-C',
    sku: 'DS-047',
    category: 'Electronics',
    price: 169.99,
    stock: 50,
    status: 'active',
    createdAt: '2025-11-25',
  },
  {
    id: '48',
    name: 'Fiber Patch Cable',
    sku: 'FP-048',
    category: 'Networking',
    price: 13.99,
    stock: 380,
    status: 'active',
    createdAt: '2025-11-24',
  },
  {
    id: '49',
    name: 'Portable HDD 4TB',
    sku: 'PH-049',
    category: 'Storage',
    price: 109.99,
    stock: 0,
    status: 'draft',
    createdAt: '2025-11-23',
  },
  {
    id: '50',
    name: 'Laptop Cooling Pad',
    sku: 'LC-050',
    category: 'Accessories',
    price: 32.99,
    stock: 275,
    status: 'active',
    createdAt: '2025-11-22',
  },
];

const productCategories = [...new Set(products.map((p) => p.category))];

function DataManagementDemo({ theme }: { theme: string }) {
  const [activeTab, setActiveTab] = React.useState('all');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  const themeClass =
    theme === 'legacy-dark'
      ? 'legacy-dark'
      : theme === 'legacy-light'
        ? 'legacy-light'
        : theme === 'light'
          ? 'future-light'
          : 'future-dark';

  const filteredProducts = React.useMemo(() => {
    let filtered = products;
    if (activeTab !== 'all') {
      filtered = filtered.filter((p) => p.status === activeTab);
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }
    return filtered;
  }, [activeTab, categoryFilter]);

  const statusTabs = [
    { value: 'all', label: 'All', count: products.length },
    {
      value: 'active',
      label: 'Active',
      count: products.filter((p) => p.status === 'active').length,
    },
    { value: 'draft', label: 'Draft', count: products.filter((p) => p.status === 'draft').length },
    {
      value: 'archived',
      label: 'Archived',
      count: products.filter((p) => p.status === 'archived').length,
    },
  ];

  const productColumns: ColumnDef<Product, unknown>[] = [
    DataTableSelectColumn<Product>(),
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-future-foreground">{row.original.name}</span>
          <span className="text-xs text-future-foreground-muted">{row.original.sku}</span>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      cell: ({ row }) => (
        <span className="text-future-foreground-muted">{row.getValue('category')}</span>
      ),
    },
    {
      accessorKey: 'price',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
      cell: ({ row }) => {
        const price = parseFloat(row.getValue('price'));
        return (
          <span className="text-future-foreground">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)}
          </span>
        );
      },
    },
    {
      accessorKey: 'stock',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Stock" />,
      cell: ({ row }) => {
        const stock = row.getValue('stock') as number;
        return (
          <span
            className={stock === 0 ? 'font-medium text-red-400' : 'text-future-foreground-muted'}
          >
            {stock === 0 ? 'Out of stock' : stock}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const colors: Record<string, string> = {
          active: 'bg-green-500/10 text-green-400',
          draft: 'bg-yellow-500/10 text-yellow-400',
          archived: 'bg-future-surface-hover text-future-foreground-muted',
        };
        return (
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? ''}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <span className="text-future-foreground-muted">{row.getValue('createdAt')}</span>
      ),
    },
    {
      id: 'actions',
      cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-future-foreground-muted transition-colors hover:bg-future-surface-hover hover:text-future-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className={cn(themeClass, 'border-future-border bg-future-surface-overlay')}
          >
            <DropdownMenuItem className="text-future-foreground-muted focus:bg-future-surface-hover focus:text-future-foreground">
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-future-foreground-muted focus:bg-future-surface-hover focus:text-future-foreground">
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-future-border-subtle" />
            <DropdownMenuItem className="text-red-400 focus:bg-future-surface-hover focus:text-red-300">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <AdminLayout theme={theme}>
      {/* Global header */}
      <MaestroHeader title="Data Management" theme={theme} menuContent={<AdminMenuNav />} />

      {/* Page content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Page header with actions */}
        <div className="flex items-center justify-between border-b border-future-border-subtle px-6 py-4">
          <h1 className="text-xl font-semibold text-future-foreground">Products</h1>
          <div className="flex items-center gap-2">
            <button className="flex h-9 items-center gap-2 rounded-lg border border-future-border bg-future-surface px-4 text-sm font-medium text-future-foreground-muted transition-colors hover:border-future-border-hover hover:text-future-foreground">
              <Upload className="h-4 w-4" />
              Import
            </button>
            <button className="flex h-9 items-center gap-2 rounded-lg border border-future-border bg-future-surface px-4 text-sm font-medium text-future-foreground-muted transition-colors hover:border-future-border-hover hover:text-future-foreground">
              <Download className="h-4 w-4" />
              Export
            </button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <button className="flex h-9 items-center gap-2 rounded-lg bg-future-accent px-4 text-sm font-medium text-future-foreground-on-accent transition-colors hover:bg-future-accent/90">
                  <Plus className="h-4 w-4" />
                  Add Product
                </button>
              </DialogTrigger>
              <DialogContent
                className={cn(
                  themeClass,
                  'border-future-border bg-future-surface-raised text-future-foreground'
                )}
              >
                <DialogHeader>
                  <DialogTitle className="text-future-foreground">Add New Product</DialogTitle>
                  <DialogDescription className="text-future-foreground-muted">
                    Enter the details for the new product.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-future-foreground">Product name</Label>
                    <Input
                      placeholder="Enter product name"
                      className="border-future-border bg-future-surface-overlay text-future-foreground placeholder:text-future-foreground-subtle"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label className="text-future-foreground">SKU</Label>
                      <Input
                        placeholder="XX-000"
                        className="border-future-border bg-future-surface-overlay text-future-foreground placeholder:text-future-foreground-subtle"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-future-foreground">Price</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="border-future-border bg-future-surface-overlay text-future-foreground placeholder:text-future-foreground-subtle"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-future-foreground">Category</Label>
                    <Select>
                      <SelectTrigger className="border-future-border bg-future-surface-overlay text-future-foreground">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent
                        className={cn(
                          themeClass,
                          'border-future-border bg-future-surface-overlay text-future-foreground'
                        )}
                      >
                        {productCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-future-foreground">Initial stock</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      className="border-future-border bg-future-surface-overlay text-future-foreground placeholder:text-future-foreground-subtle"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <button
                    className="flex h-9 items-center rounded-lg border border-future-border bg-future-surface px-4 text-sm font-medium text-future-foreground-muted transition-colors hover:border-future-border-hover hover:text-future-foreground"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex h-9 items-center rounded-lg bg-future-accent px-4 text-sm font-medium text-future-foreground-on-accent transition-colors hover:bg-future-accent/90"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Create product
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs + filter bar */}
        <div className="flex items-center justify-between border-b border-future-border-subtle px-6 py-3">
          <div className="flex gap-1">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.value
                    ? 'bg-future-surface-hover text-future-foreground'
                    : 'text-future-foreground-muted hover:text-future-foreground'
                }`}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
                <span className="rounded-full bg-future-surface-overlay px-1.5 py-0.5 text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-[150px] border-future-border bg-future-surface-overlay text-sm text-future-foreground">
                <Filter className="mr-2 h-4 w-4 text-future-foreground-muted" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent
                className={cn(
                  themeClass,
                  'border-future-border bg-future-surface-overlay text-future-foreground'
                )}
              >
                <SelectItem value="all">All categories</SelectItem>
                {productCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-future-border text-future-foreground-muted transition-colors hover:border-future-border-hover hover:text-future-foreground">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6 pt-4">
          <DataTable
            columns={productColumns}
            data={filteredProducts}
            searchKey="name"
            searchPlaceholder="Search products..."
            showColumnToggle
            showPagination
            pageSize={10}
            compact
          />
        </div>
      </div>
    </AdminLayout>
  );
}

export const DataManagement: Story = {
  name: 'Data Management',
  render: (_, { globals }) => {
    return <DataManagementDemo theme={globals.futureTheme || 'dark'} />;
  },
};

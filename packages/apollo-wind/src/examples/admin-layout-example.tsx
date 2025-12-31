import * as React from 'react';
import { cn } from '@/lib';
import { Search, Plus, ChevronsLeft, ChevronsRight, HelpCircle, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DataTable,
  DataTableColumnHeader,
  DataTableSelectColumn,
} from '@/components/ui/data-table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Row, Column } from '@/components/ui/layout';

// Admin Layout Container
interface AdminLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function AdminLayout({ className, children, ...props }: AdminLayoutProps) {
  return (
    <div
      className={cn(
        'flex h-[700px] w-full flex-col overflow-hidden rounded-lg border bg-background',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Top Header Bar
interface AdminHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  logo?: React.ReactNode;
  title?: string;
  children?: React.ReactNode;
}

export function AdminHeader({ className, logo, title, children, ...props }: AdminHeaderProps) {
  return (
    <header
      className={cn(
        'flex h-14 items-center justify-between border-b bg-background px-4',
        className,
      )}
      {...props}
    >
      <Row gap={3} align="center">
        {logo}
        {title && <span className="text-lg font-semibold">{title}</span>}
      </Row>
      <Row gap={2} align="center">
        {children}
      </Row>
    </header>
  );
}

// Header Actions (notifications, help, profile)
interface AdminHeaderActionsProps {
  notifications?: number;
  avatar?: React.ReactNode;
}

export function AdminHeaderActions({ notifications, avatar }: AdminHeaderActionsProps) {
  return (
    <Row gap={1} align="center">
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        {notifications && notifications > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
            {notifications}
          </span>
        )}
      </Button>
      <Button variant="ghost" size="icon">
        <HelpCircle className="h-5 w-5" />
      </Button>
      {avatar || (
        <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          SN
        </div>
      )}
    </Row>
  );
}

// Main Content Area with Sidebar
interface AdminContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function AdminContent({ className, children, ...props }: AdminContentProps) {
  return (
    <Row flex={1} overflow="hidden" className={className} {...props}>
      {children}
    </Row>
  );
}

// Sidebar
interface AdminSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  width?: number;
}

export function AdminSidebar({ className, children, width = 280, ...props }: AdminSidebarProps) {
  return (
    <Column className={cn('border-r bg-muted/30', className)} style={{ width }} {...props}>
      {children}
    </Column>
  );
}

// Sidebar Header with title and actions
interface AdminSidebarHeaderProps {
  title: string;
  onSearch?: () => void;
  onAdd?: () => void;
}

export function AdminSidebarHeader({ title, onSearch, onAdd }: AdminSidebarHeaderProps) {
  return (
    <Row justify="between" align="center" className="border-b px-4 py-3">
      <span className="text-sm font-medium">{title}</span>
      <Row gap={1} align="center">
        {onSearch && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSearch}>
            <Search className="h-4 w-4" />
          </Button>
        )}
        {onAdd && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAdd}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </Row>
    </Row>
  );
}

// Sidebar Navigation Item
interface AdminNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

interface AdminSidebarNavProps {
  items: AdminNavItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export function AdminSidebarNav({ items, selectedId, onSelect }: AdminSidebarNavProps) {
  return (
    <ScrollArea className="flex-1">
      <nav className="p-2">
        {items.map((item) => (
          <Row
            key={item.id}
            gap={2}
            align="center"
            className={cn(
              'cursor-pointer rounded-md px-3 py-2 text-sm transition-colors',
              selectedId === item.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
            onClick={() => onSelect?.(item.id)}
          >
            {item.icon}
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge}
          </Row>
        ))}
      </nav>
    </ScrollArea>
  );
}

// Main Panel
interface AdminMainProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function AdminMain({ className, children, ...props }: AdminMainProps) {
  return (
    <Column flex={1} overflow="hidden" className={className} {...props}>
      {children}
    </Column>
  );
}

// Breadcrumb
interface BreadcrumbItemType {
  label: string;
  href?: string;
}

interface AdminBreadcrumbProps {
  items: BreadcrumbItemType[];
}

export function AdminBreadcrumb({ items }: AdminBreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <React.Fragment key={item.label}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {index === items.length - 1 ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href || '#'}>{item.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// Page Header
interface AdminPageHeaderProps {
  title: string;
  breadcrumb?: BreadcrumbItemType[];
  actions?: React.ReactNode;
  tabs?: { value: string; label: string }[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

export function AdminPageHeader({
  title,
  breadcrumb,
  actions,
  tabs,
  activeTab,
  onTabChange,
}: AdminPageHeaderProps) {
  return (
    <div className="border-b px-6 py-4">
      {breadcrumb && (
        <div className="mb-2">
          <AdminBreadcrumb items={breadcrumb} />
        </div>
      )}
      <Row justify="between" align="center">
        <h1 className="text-xl font-semibold">{title}</h1>
        {actions && (
          <Row gap={2} align="center">
            {actions}
          </Row>
        )}
      </Row>
      {tabs && (
        <Tabs value={activeTab} onValueChange={onTabChange} className="mt-4">
          <TabsList className="h-auto bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none border-b-2 border-transparent px-4 pb-2 pt-1 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
    </div>
  );
}

// Toolbar with filters
interface AdminToolbarProps {
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export function AdminToolbar({ children, actions }: AdminToolbarProps) {
  return (
    <Row justify="between" align="center" className="border-b px-6 py-3">
      <Row gap={3} align="center">
        {children}
      </Row>
      <Row gap={2} align="center">
        {actions}
      </Row>
    </Row>
  );
}

// Filter Dropdown
interface AdminFilterProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onValueChange?: (value: string) => void;
}

export function AdminFilter({ label, value, options, onValueChange }: AdminFilterProps) {
  return (
    <Row gap={1.5} align="center" className="text-sm">
      <span className="text-muted-foreground">{label}:</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-transparent px-1 font-medium shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Row>
  );
}

// Data Table for Admin
// Re-export DataTable components for use with AdminLayout
export { DataTable as AdminTable, DataTableColumnHeader, DataTableSelectColumn };

// Pagination
interface AdminPaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function AdminPagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: AdminPaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: number[] = [];
    const delta = 1; // Number of pages to show on each side of current page

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || // First page
        i === totalPages || // Last page
        (i >= page - delta && i <= page + delta) // Pages around current
      ) {
        pages.push(i);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <Row justify="between" align="center" className="border-t px-6 py-3">
      <span className="text-sm text-muted-foreground">
        {start} - {end} / {total}
      </span>
      <Row gap={4} align="center">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={page === 1}
                onClick={() => onPageChange?.(1)}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => page > 1 && onPageChange?.(page - 1)}
                className={cn(page === 1 && 'pointer-events-none opacity-50')}
              />
            </PaginationItem>

            {pageNumbers.map((pageNum, index) => {
              const prevPage = pageNumbers[index - 1];
              const showEllipsis = prevPage && pageNum - prevPage > 1;

              return (
                <React.Fragment key={pageNum}>
                  {showEllipsis && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => onPageChange?.(pageNum)}
                      isActive={page === pageNum}
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
                className={cn(page === totalPages && 'pointer-events-none opacity-50')}
              />
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={page === totalPages}
                onClick={() => onPageChange?.(totalPages)}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        {onPageSizeChange && (
          <Row gap={2} align="center" className="text-sm">
            <span className="text-muted-foreground">Items</span>
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger className="h-8 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </Row>
        )}
      </Row>
    </Row>
  );
}

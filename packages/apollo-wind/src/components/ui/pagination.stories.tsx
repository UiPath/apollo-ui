import type { Meta } from '@storybook/react-vite';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import * as React from 'react';
import { Button } from './button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

const meta: Meta<typeof Pagination> = {
  title: 'Components/Navigation/Pagination',
  component: Pagination,
  tags: ['autodocs'],
};

export default meta;

// ============================================================================
// Basic
// ============================================================================

export const Basic = {
  name: 'Basic',
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">10</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
};

// ============================================================================
// With Buttons
// ============================================================================

export const WithButtons = {
  name: 'With Buttons',
  render: () => {
    const [page, setPage] = React.useState(3);
    const totalPages = 10;

    return (
      <div className="flex flex-col items-center gap-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
            </PaginationItem>
            {[1, 2, 3, 4, 5].map((p) => (
              <PaginationItem key={p}>
                <Button
                  variant={p === page ? 'outline' : 'ghost'}
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setPage(totalPages)}
              >
                {totalPages}
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </p>
      </div>
    );
  },
};

// ============================================================================
// With Icons
// ============================================================================

export const WithIcons = {
  name: 'With Icons',
  render: () => {
    const [page, setPage] = React.useState(3);
    const totalPages = 10;

    return (
      <div className="flex flex-col items-center gap-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>
            {Array.from({ length: 5 }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              return (
                <PaginationItem key={p}>
                  <Button
                    variant={p === page ? 'outline' : 'ghost'}
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </p>
      </div>
    );
  },
};

// ============================================================================
// Examples
// ============================================================================

export const Examples = {
  name: 'Examples',
  render: () => {
    const [gridPage, setGridPage] = React.useState(1);
    const [rowsPerPage, setRowsPerPage] = React.useState('10');
    const totalRows = 87;
    const rows = Number(rowsPerPage);
    const totalGridPages = Math.ceil(totalRows / rows);

    const [listPage, setListPage] = React.useState(1);
    const totalListPages = 5;

    return (
      <div className="flex flex-col gap-10">
        {/* Data Grid */}
        <div>
          <p className="text-sm font-medium mb-3">Data Grid</p>
          <div className="rounded-lg border">
            {/* Table header */}
            <div className="grid grid-cols-4 gap-4 border-b px-4 py-3 text-sm font-medium text-muted-foreground">
              <span>Name</span>
              <span>Status</span>
              <span>Type</span>
              <span>Updated</span>
            </div>
            {/* Table rows */}
            {Array.from({ length: Math.min(rows, totalRows - (gridPage - 1) * rows) }, (_, i) => {
              const index = (gridPage - 1) * rows + i + 1;
              return (
                <div
                  key={index}
                  className="grid grid-cols-4 gap-4 border-b px-4 py-2.5 text-sm last:border-0"
                >
                  <span>Item {index}</span>
                  <span className="text-green-600">Active</span>
                  <span className="text-muted-foreground">Document</span>
                  <span className="text-muted-foreground">2 days ago</span>
                </div>
              );
            })}
            {/* Pagination footer */}
            <div className="flex items-center justify-between border-t px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Rows per page</span>
                <Select value={rowsPerPage} onValueChange={(v) => { setRowsPerPage(v); setGridPage(1); }}>
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {gridPage} of {totalGridPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setGridPage(1)}
                    disabled={gridPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setGridPage((p) => Math.max(1, p - 1))}
                    disabled={gridPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setGridPage((p) => Math.min(totalGridPages, p + 1))}
                    disabled={gridPage === totalGridPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setGridPage(totalGridPages)}
                    disabled={gridPage === totalGridPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card list pagination */}
        <div>
          <p className="text-sm font-medium mb-3">Card List</p>
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => {
              const index = (listPage - 1) * 3 + i + 1;
              return (
                <div key={index} className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div>
                    <p className="text-sm font-medium">Project {index}</p>
                    <p className="text-xs text-muted-foreground">Last updated 3 days ago</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setListPage((p) => Math.max(1, p - 1))}
                    disabled={listPage === 1}
                  >
                    Previous
                  </Button>
                </PaginationItem>
                {Array.from({ length: totalListPages }, (_, i) => (
                  <PaginationItem key={i + 1}>
                    <Button
                      variant={i + 1 === listPage ? 'outline' : 'ghost'}
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setListPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setListPage((p) => Math.min(totalListPages, p + 1))}
                    disabled={listPage === totalListPages}
                  >
                    Next
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    );
  },
};

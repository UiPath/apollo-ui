"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircleIcon,
  ChevronRightIcon,
  CircleDotIcon,
  ClockIcon,
  MoreHorizontalIcon,
  XCircleIcon,
} from "lucide-react";
import dynamic from "next/dynamic";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableFacetedFilter,
  type DataTableFacetedFilterOption,
  dataTableFacetedFilterFn,
} from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDataTable } from "@/registry/use-data-table/useDataTable";

type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

const data: Payment[] = [
  {
    id: "m5gr84i9",
    amount: 316,
    status: "success",
    email: "ken99@yahoo.com",
  },
  {
    id: "3u1reuv4",
    amount: 242,
    status: "success",
    email: "abe45@gmail.com",
  },
  {
    id: "derv1ws0",
    amount: 837,
    status: "processing",
    email: "monserrat44@gmail.com",
  },
  {
    id: "5kma53ae",
    amount: 874,
    status: "success",
    email: "silas22@gmail.com",
  },
  {
    id: "bhqecj4p",
    amount: 721,
    status: "failed",
    email: "carmella@hotmail.com",
  },
  {
    id: "p0r8sd2k",
    amount: 150,
    status: "pending",
    email: "julia@example.com",
  },
  {
    id: "k7wd3f1m",
    amount: 495,
    status: "success",
    email: "derek@outlook.com",
  },
  {
    id: "x9qn5v2j",
    amount: 63,
    status: "failed",
    email: "patricia@yahoo.com",
  },
  {
    id: "w2me7t4h",
    amount: 1200,
    status: "processing",
    email: "james.wilson@gmail.com",
  },
  {
    id: "r4kp9b6l",
    amount: 389,
    status: "pending",
    email: "sarah.connor@example.com",
  },
  {
    id: "t6nq2c8f",
    amount: 550,
    status: "success",
    email: "michael.b@hotmail.com",
  },
  {
    id: "y8sv4e0d",
    amount: 99,
    status: "failed",
    email: "emma.j@outlook.com",
  },
];

const statusVariant: Record<
  Payment["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  success: "default",
  processing: "secondary",
  pending: "outline",
  failed: "destructive",
};

const statusFilterOptions: DataTableFacetedFilterOption[] = [
  { label: "Success", value: "success", icon: CheckCircleIcon },
  { label: "Processing", value: "processing", icon: ClockIcon },
  { label: "Pending", value: "pending", icon: CircleDotIcon },
  { label: "Failed", value: "failed", icon: XCircleIcon },
];

const columns: ColumnDef<Payment>[] = [
  {
    id: "expand",
    header: () => null,
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={(e) => {
          e.stopPropagation();
          row.toggleExpanded();
        }}
      >
        <ChevronRightIcon
          className={`size-4 transition-transform ${row.getIsExpanded() ? "rotate-90" : ""}`}
        />
        <span className="sr-only">
          {row.getIsExpanded() ? "Collapse row" : "Expand row"}
        </span>
      </Button>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as Payment["status"];
      return <Badge variant={statusVariant[status]}>{status}</Badge>;
    },
    filterFn: dataTableFacetedFilterFn,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Amount"
        className="justify-end"
      />
    ),
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const payment = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <span className="sr-only">Open menu</span>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(payment.id)}
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

function DataTableTemplateContent() {
  const tableState = useDataTable({
    data,
    columns,
    storageKey: "payments-demo",
    defaultColumnOrder: ["select", "status", "email", "amount", "actions"],
  });

  return (
    <div className="p-4">
      <DataTable
        {...tableState}
        toolbarContent={(table) => (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={statusFilterOptions}
          />
        )}
      />
    </div>
  );
}

export const DataTableTemplate = dynamic(
  () => Promise.resolve(DataTableTemplateContent),
  { ssr: false },
);

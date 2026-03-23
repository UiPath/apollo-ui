"use client";

import type { ColumnDef, ExpandedState } from "@tanstack/react-table";
import {
  CheckCircleIcon,
  ChevronRightIcon,
  CircleDotIcon,
  ClockIcon,
  MoreHorizontalIcon,
  XCircleIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

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
  name: string;
  date: string;
  method: "credit_card" | "bank_transfer" | "paypal" | "crypto";
};

const data: Payment[] = [
  {
    id: "m5gr84i9",
    amount: 316,
    status: "success",
    email: "ken99@yahoo.com",
    name: "Ken Adams",
    date: "2024-03-12",
    method: "credit_card",
  },
  {
    id: "3u1reuv4",
    amount: 242,
    status: "success",
    email: "abe45@gmail.com",
    name: "Abraham Lee",
    date: "2024-03-14",
    method: "paypal",
  },
  {
    id: "derv1ws0",
    amount: 837,
    status: "processing",
    email: "monserrat44@gmail.com",
    name: "Monserrat Rivera",
    date: "2024-03-15",
    method: "bank_transfer",
  },
  {
    id: "5kma53ae",
    amount: 874,
    status: "success",
    email: "silas22@gmail.com",
    name: "Silas Moore",
    date: "2024-03-16",
    method: "credit_card",
  },
  {
    id: "bhqecj4p",
    amount: 721,
    status: "failed",
    email: "carmella@hotmail.com",
    name: "Carmella DiNapoli",
    date: "2024-03-17",
    method: "crypto",
  },
  {
    id: "p0r8sd2k",
    amount: 150,
    status: "pending",
    email: "julia@example.com",
    name: "Julia Souza",
    date: "2024-03-18",
    method: "paypal",
  },
  {
    id: "k7wd3f1m",
    amount: 495,
    status: "success",
    email: "derek@outlook.com",
    name: "Derek Frost",
    date: "2024-03-19",
    method: "bank_transfer",
  },
  {
    id: "x9qn5v2j",
    amount: 63,
    status: "failed",
    email: "patricia@yahoo.com",
    name: "Patricia Walsh",
    date: "2024-03-20",
    method: "credit_card",
  },
  {
    id: "w2me7t4h",
    amount: 1200,
    status: "processing",
    email: "james.wilson@gmail.com",
    name: "James Wilson",
    date: "2024-03-21",
    method: "bank_transfer",
  },
  {
    id: "r4kp9b6l",
    amount: 389,
    status: "pending",
    email: "sarah.connor@example.com",
    name: "Sarah Connor",
    date: "2024-03-22",
    method: "credit_card",
  },
  {
    id: "t6nq2c8f",
    amount: 550,
    status: "success",
    email: "michael.b@hotmail.com",
    name: "Michael Burke",
    date: "2024-03-23",
    method: "paypal",
  },
  {
    id: "y8sv4e0d",
    amount: 99,
    status: "failed",
    email: "emma.j@outlook.com",
    name: "Emma Jensen",
    date: "2024-03-24",
    method: "crypto",
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
    id: "select",
    size: 50,
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
    id: "expand",
    header: () => null,
    size: 60,
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
    accessorKey: "status",
    minSize: 100,
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
    minSize: 100,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: "amount",
    minSize: 250,
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
    minSize: 32,
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
    defaultColumnOrder: [
      "select",
      "expand",
      "status",
      "email",
      "amount",
      "actions",
    ],
  });

  const [expanded, setExpanded] = useState<ExpandedState>({});

  return (
    <div className="p-4">
      <DataTable
        {...tableState}
        enableColumnResizing
        expanded={expanded}
        onExpandedChange={setExpanded}
        renderExpandedRow={(row) => {
          const payment = row.original;
          return (
            <div className="flex flex-wrap gap-x-10 gap-y-4 p-4 justify-center text-sm">
              <div>
                <span className="text-muted-foreground">ID</span>
                <p className="font-medium">{payment.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Customer</span>
                <p className="font-medium">{payment.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email</span>
                <p className="font-medium">{payment.email}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Date</span>
                <p className="font-medium">
                  {new Intl.DateTimeFormat("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }).format(new Date(payment.date))}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Amount</span>
                <p className="font-medium">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(payment.amount)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Method</span>
                <p className="font-medium capitalize">
                  {payment.method.replace("_", " ")}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <p>
                  <Badge variant={statusVariant[payment.status]}>
                    {payment.status}
                  </Badge>
                </p>
              </div>
            </div>
          );
        }}
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

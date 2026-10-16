import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "@/locales/en.json";
import type { DataTableColumnDef } from "@/lib/table-features";

import { DataTable, type DataTableProps } from "./data-table";

if (!i18n.isInitialized) {
  // oxlint-disable-next-line import/no-named-as-default-member -- i18next registers plugins on the instance
  void i18n.use(initReactI18next).init({
    lng: "en",
    resources: { en: { "apollo-vertex": en, translation: en } },
    ns: ["translation", "apollo-vertex"],
    defaultNS: "translation",
    interpolation: { escapeValue: false },
  });
}

class ResizeObserverStub {
  observed = false;

  observe() {
    this.observed = true;
  }

  unobserve() {
    this.observed = false;
  }

  disconnect() {
    this.observed = false;
  }
}

globalThis.ResizeObserver ??=
  // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- test stub stands in for the DOM class jsdom lacks
  ResizeObserverStub as unknown as typeof ResizeObserver;

type Row = { id: string; amount: number };

const columns: DataTableColumnDef<Row>[] = [
  {
    accessorKey: "id",
    header: "Identifier",
    meta: { displayName: "Identifier" },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    meta: { displayName: "Amount", numeric: true },
  },
];

const rows: Row[] = [
  { id: "a", amount: 10 },
  { id: "b", amount: 20 },
];

const ignoreChange = () => false;

function renderTable(overrides: Partial<DataTableProps<Row>> = {}) {
  const props: DataTableProps<Row> = {
    columns,
    data: rows,
    sorting: [],
    onSortingChange: ignoreChange,
    columnFilters: [],
    onColumnFiltersChange: ignoreChange,
    columnVisibility: {},
    onColumnVisibilityChange: ignoreChange,
    columnOrder: ["id", "amount"],
    onColumnOrderChange: ignoreChange,
    globalFilter: "",
    onGlobalFilterChange: ignoreChange,
    enableSearch: false,
    enableViewOptions: false,
    ...overrides,
  };
  return render(<DataTable {...props} />);
}

afterEach(() => {
  cleanup();
});

describe("DataTable screen props", () => {
  it("names the search input with searchPlaceholder", () => {
    renderTable({
      enableSearch: true,
      searchPlaceholder: "Search invoices",
    });

    const search = screen.getByRole("textbox", { name: "Search invoices" });
    expect(search).toHaveProperty("placeholder", "Search invoices");
  });

  it("right-aligns numeric columns", () => {
    renderTable();

    const amountHeader = screen.getByRole("columnheader", { name: "Amount" });
    expect(amountHeader.className).toContain("text-right");

    const amountCell = screen.getByRole("cell", { name: "20" });
    expect(amountCell.className).toContain("text-right");
    expect(amountCell.className).toContain("tabular-nums");
  });

  it("shows the visible row range from rowCount", () => {
    renderTable({
      manualPagination: true,
      rowCount: 40,
      pagination: { pageIndex: 1, pageSize: 10 },
      onPaginationChange: ignoreChange,
    });

    expect(screen.getByText("Showing 11–20 of 40")).toBeTruthy();
  });

  it("leaves a stale page alone while loading, then reports it", () => {
    const onPageIndexOutOfRange = vi.fn();
    const view = renderTable({
      isLoading: true,
      data: [],
      pagination: { pageIndex: 5, pageSize: 10 },
      onPaginationChange: ignoreChange,
      onPageIndexOutOfRange,
      rowCount: 2,
      manualPagination: true,
    });

    expect(onPageIndexOutOfRange).not.toHaveBeenCalled();

    view.rerender(
      <DataTable
        columns={columns}
        data={rows}
        sorting={[]}
        onSortingChange={ignoreChange}
        columnFilters={[]}
        onColumnFiltersChange={ignoreChange}
        columnVisibility={{}}
        onColumnVisibilityChange={ignoreChange}
        columnOrder={["id", "amount"]}
        onColumnOrderChange={ignoreChange}
        globalFilter=""
        onGlobalFilterChange={ignoreChange}
        enableSearch={false}
        enableViewOptions={false}
        isLoading={false}
        pagination={{ pageIndex: 5, pageSize: 10 }}
        onPaginationChange={ignoreChange}
        onPageIndexOutOfRange={onPageIndexOutOfRange}
        rowCount={2}
        manualPagination
      />,
    );

    expect(onPageIndexOutOfRange).toHaveBeenCalledWith(0);
  });

  it("opens getRowHref on middle click and skips rows that are not clickable", () => {
    const onRowClick = vi.fn();
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    renderTable({
      onRowClick,
      isRowClickable: (row) => row.id === "a",
      getRowHref: (row) => `/invoices/${row.id}`,
    });

    const clickable = screen.getByRole("cell", { name: "a" }).closest("tr");
    const blocked = screen.getByRole("cell", { name: "b" }).closest("tr");
    if (!clickable || !blocked) throw new Error("missing row");

    fireEvent.click(clickable);
    fireEvent.click(blocked);
    clickable.dispatchEvent(
      new MouseEvent("auxclick", {
        bubbles: true,
        button: 1,
        cancelable: true,
      }),
    );

    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
    expect(open).toHaveBeenCalledWith(
      "/invoices/a",
      "_blank",
      "noopener,noreferrer",
    );
    open.mockRestore();
  });

  it("shows an empty state when the column menu search matches nothing", () => {
    renderTable({ enableViewOptions: true });

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Toggle columns" }),
      { button: 0, ctrlKey: false },
    );
    fireEvent.change(screen.getByPlaceholderText("Search..."), {
      target: { value: "missing" },
    });

    expect(screen.getByText("No results found")).toBeTruthy();
  });
});

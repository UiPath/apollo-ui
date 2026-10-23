import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { SortingState } from "@tanstack/react-table";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DataTableColumnDef } from "@/lib/table-features";

import { useDataTable } from "./useDataTable";

type Row = { name: string };

const columns: DataTableColumnDef<Row>[] = [
  { accessorKey: "name", header: "Name" },
];

const data: Row[] = [{ name: "Ada" }];

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function HookProbe({
  sortingControl,
  globalFilterControl,
  paginationControl,
}: {
  sortingControl?: {
    sorting: SortingState;
    onSortingChange: (sorting: SortingState) => void;
  };
  globalFilterControl?: {
    globalFilter: string;
    onGlobalFilterChange: (globalFilter: string) => void;
  };
  paginationControl?: {
    pageIndex: number;
    onPageIndexChange: (pageIndex: number) => void;
    onPageIndexOutOfRange?: (pageIndex: number) => void;
  };
}) {
  const state = useDataTable({
    data,
    columns,
    storageKey: "hook-probe",
    sortingControl,
    globalFilterControl,
    paginationControl,
  });

  return (
    <div>
      <button
        type="button"
        onClick={() => state.onSortingChange([{ id: "name", desc: false }])}
      >
        {`sort:${JSON.stringify(state.sorting)}`}
      </button>
      <button type="button" onClick={() => state.onGlobalFilterChange("acme")}>
        {`filter:${state.globalFilter}`}
      </button>
      <button
        type="button"
        onClick={() =>
          state.onPaginationChange({
            pageIndex: state.pagination.pageIndex + 1,
            pageSize: state.pagination.pageSize,
          })
        }
      >
        {`page:${state.pagination.pageIndex}`}
      </button>
      <span>{state.onPageIndexOutOfRange ? "clamp:set" : "clamp:unset"}</span>
    </div>
  );
}

describe("useDataTable controls", () => {
  it("keeps both uncontrolled filter updates made before a rerender", () => {
    function FilterProbe() {
      const state = useDataTable({
        data,
        columns,
        storageKey: "filter-batch",
      });
      return (
        <button
          type="button"
          onClick={() => {
            state.onGlobalFilterChange((value) => `${value}a`);
            state.onGlobalFilterChange((value) => `${value}b`);
          }}
        >
          {`filter:${state.globalFilter}`}
        </button>
      );
    }

    render(<FilterProbe />);
    fireEvent.click(screen.getByRole("button", { name: "filter:" }));

    expect(screen.getByRole("button", { name: "filter:ab" })).toBeTruthy();
  });

  it("keeps sorting on usePersistedSorting when no control is passed", () => {
    render(<HookProbe />);

    expect(screen.getByRole("button", { name: /^sort:/ }).textContent).toBe(
      "sort:[]",
    );

    fireEvent.click(screen.getByRole("button", { name: /^sort:/ }));

    expect(screen.getByRole("button", { name: /^sort:/ }).textContent).toBe(
      'sort:[{"id":"name","desc":false}]',
    );
  });

  it("reports sort, search, and page changes to the caller controls", () => {
    const onSortingChange = vi.fn();
    const onGlobalFilterChange = vi.fn();
    const onPageIndexChange = vi.fn();
    const onPageIndexOutOfRange = vi.fn();

    render(
      <HookProbe
        sortingControl={{
          sorting: [{ id: "name", desc: true }],
          onSortingChange,
        }}
        globalFilterControl={{ globalFilter: "kept", onGlobalFilterChange }}
        paginationControl={{
          pageIndex: 3,
          onPageIndexChange,
          onPageIndexOutOfRange,
        }}
      />,
    );

    expect(screen.getByRole("button", { name: /^sort:/ }).textContent).toBe(
      'sort:[{"id":"name","desc":true}]',
    );
    expect(screen.getByRole("button", { name: /^filter:/ }).textContent).toBe(
      "filter:kept",
    );
    expect(screen.getByRole("button", { name: /^page:/ }).textContent).toBe(
      "page:3",
    );
    expect(screen.getByText("clamp:set")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /^sort:/ }));
    fireEvent.click(screen.getByRole("button", { name: /^filter:/ }));
    fireEvent.click(screen.getByRole("button", { name: /^page:/ }));

    expect(onSortingChange).toHaveBeenCalledWith([{ id: "name", desc: false }]);
    expect(onGlobalFilterChange).toHaveBeenCalledWith("acme");
    expect(onPageIndexChange).toHaveBeenCalledWith(4);
    expect(screen.getByRole("button", { name: /^sort:/ }).textContent).toBe(
      'sort:[{"id":"name","desc":true}]',
    );
    expect(screen.getByRole("button", { name: /^filter:/ }).textContent).toBe(
      "filter:kept",
    );
    expect(screen.getByRole("button", { name: /^page:/ }).textContent).toBe(
      "page:3",
    );
  });
});

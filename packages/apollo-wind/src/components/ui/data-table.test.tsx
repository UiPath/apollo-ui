import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { ColumnDef } from "@tanstack/react-table";
import { describe, expect, it, vi } from "vitest";
import { DataTable, DataTableColumnHeader, DataTableSelectColumn } from "./data-table";

interface TestData {
  id: string;
  name: string;
  email: string;
}

const mockData: TestData[] = [
  { id: "1", name: "John Doe", email: "john@example.com" },
  { id: "2", name: "Jane Smith", email: "jane@example.com" },
  { id: "3", name: "Bob Wilson", email: "bob@example.com" },
];

const columns: ColumnDef<TestData>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
];

describe("DataTable", () => {
  describe("rendering", () => {
    it("renders table with data", () => {
      render(<DataTable columns={columns} data={mockData} />);
      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("renders column headers", () => {
      render(<DataTable columns={columns} data={mockData} />);
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
    });

    it("renders empty state when no data", () => {
      render(<DataTable columns={columns} data={[]} />);
      expect(screen.getByText("No results.")).toBeInTheDocument();
    });

    it("renders pagination controls", () => {
      render(<DataTable columns={columns} data={mockData} />);
      expect(screen.getByRole("button", { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    });

    it("renders column toggle dropdown", () => {
      render(<DataTable columns={columns} data={mockData} />);
      expect(screen.getByRole("button", { name: /columns/i })).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has no accessibility violations", async () => {
      const { container } = render(<DataTable columns={columns} data={mockData} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has no violations with search", async () => {
      const { container } = render(
        <DataTable columns={columns} data={mockData} searchKey="name" />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("search functionality", () => {
    it("renders search input when searchKey provided", () => {
      render(<DataTable columns={columns} data={mockData} searchKey="name" />);
      expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    });

    it("uses custom search placeholder", () => {
      render(
        <DataTable
          columns={columns}
          data={mockData}
          searchKey="name"
          searchPlaceholder="Search names..."
        />,
      );
      expect(screen.getByPlaceholderText("Search names...")).toBeInTheDocument();
    });

    it("filters data when searching", async () => {
      const user = userEvent.setup();
      render(<DataTable columns={columns} data={mockData} searchKey="name" />);

      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "John");

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
      });
    });

    it("does not render search when searchKey not provided", () => {
      render(<DataTable columns={columns} data={mockData} />);
      expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument();
    });
  });

  describe("pagination", () => {
    it("shows row selection count", () => {
      render(<DataTable columns={columns} data={mockData} />);
      expect(screen.getByText(/0 of 3 row\(s\) selected/)).toBeInTheDocument();
    });

    it("shows page info", () => {
      render(<DataTable columns={columns} data={mockData} />);
      expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument();
    });

    it("disables previous button on first page", () => {
      render(<DataTable columns={columns} data={mockData} />);
      expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    });

    it("hides pagination when showPagination is false", () => {
      render(<DataTable columns={columns} data={mockData} showPagination={false} />);
      expect(screen.queryByRole("button", { name: /previous/i })).not.toBeInTheDocument();
    });

    it("respects pageSize prop", () => {
      const largeData = Array.from({ length: 25 }, (_, i) => ({
        id: String(i),
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));
      render(<DataTable columns={columns} data={largeData} pageSize={5} />);
      expect(screen.getByText(/Page 1 of 5/)).toBeInTheDocument();
    });
  });

  describe("column toggle", () => {
    it("toggles column visibility", async () => {
      const user = userEvent.setup();
      render(<DataTable columns={columns} data={mockData} />);

      await user.click(screen.getByRole("button", { name: /columns/i }));

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      // Column names should appear in dropdown
      expect(screen.getByText("name")).toBeInTheDocument();
      expect(screen.getByText("email")).toBeInTheDocument();
    });

    it("hides column toggle when showColumnToggle is false", () => {
      render(<DataTable columns={columns} data={mockData} showColumnToggle={false} />);
      expect(screen.queryByRole("button", { name: /columns/i })).not.toBeInTheDocument();
    });
  });
});

describe("DataTableColumnHeader", () => {
  it("renders sortable header", () => {
    const mockColumn = {
      toggleSorting: vi.fn(),
      getIsSorted: () => false,
    };

    render(<DataTableColumnHeader column={mockColumn as never} title="Name" />);
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("calls toggleSorting on click", async () => {
    const user = userEvent.setup();
    const mockColumn = {
      toggleSorting: vi.fn(),
      getIsSorted: () => false,
    };

    render(<DataTableColumnHeader column={mockColumn as never} title="Name" />);

    await user.click(screen.getByRole("button"));
    expect(mockColumn.toggleSorting).toHaveBeenCalled();
  });
});

describe("DataTableSelectColumn", () => {
  it("creates select column definition", () => {
    const selectColumn = DataTableSelectColumn<TestData>();
    expect(selectColumn.id).toBe("select");
    expect(selectColumn.enableSorting).toBe(false);
    expect(selectColumn.enableHiding).toBe(false);
  });

  it("renders select all checkbox in header", () => {
    const columnsWithSelect = [DataTableSelectColumn<TestData>(), ...columns];
    render(<DataTable columns={columnsWithSelect} data={mockData} />);
    expect(screen.getByLabelText("Select all")).toBeInTheDocument();
  });

  it("renders row checkboxes", () => {
    const columnsWithSelect = [DataTableSelectColumn<TestData>(), ...columns];
    render(<DataTable columns={columnsWithSelect} data={mockData} />);
    expect(screen.getAllByLabelText("Select row")).toHaveLength(3);
  });
});

import type { Meta } from '@storybook/react-vite';
import type { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';
import { DataTable } from './data-table';
import { createEditableColumn, EditableCell } from './editable-cell';

const meta: Meta<typeof EditableCell> = {
  title: 'Components/Data Display/Editable Cell',
  component: EditableCell,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Inline-editable cell renderer for @tanstack/react-table. The cell type is driven by ' +
          'column meta (text, number, select, date, checkbox). Use createEditableColumn to build ' +
          'column definitions, then render them inside a DataTable with the editable prop.',
      },
    },
  },
};

export default meta;

// ============================================================================
// Shared data
// ============================================================================

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  restockDate: string;
  inStock: boolean;
};

const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Keyboard',
    price: 59,
    category: 'accessories',
    restockDate: '2026-09-01',
    inStock: true,
  },
  {
    id: '2',
    name: 'USB-C Hub',
    price: 39,
    category: 'accessories',
    restockDate: '2026-09-15',
    inStock: false,
  },
  {
    id: '3',
    name: '27 inch Monitor',
    price: 329,
    category: 'displays',
    restockDate: '2026-10-02',
    inStock: true,
  },
  {
    id: '4',
    name: 'Laptop Stand',
    price: 24,
    category: 'accessories',
    restockDate: '2026-08-28',
    inStock: true,
  },
  {
    id: '5',
    name: 'Webcam',
    price: 89,
    category: 'peripherals',
    restockDate: '2026-09-20',
    inStock: false,
  },
];

// ============================================================================
// Single Editable Column
// ============================================================================

function SingleEditableColumnExample() {
  const [data, setData] = React.useState<Product[]>(initialProducts);

  const handleCellUpdate = (rowIndex: number, columnId: string, value: unknown) => {
    setData((prev) => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], [columnId]: value };
      return next;
    });
  };

  const columns: ColumnDef<Product, unknown>[] = [
    createEditableColumn<Product>('name', 'Product', {
      type: 'text',
      placeholder: 'Enter product name...',
    }),
    { accessorKey: 'price', header: 'Price' },
    { accessorKey: 'category', header: 'Category' },
  ];

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Only the Product column is editable. Click a cell to edit, press Enter to save, Escape to
        cancel.
      </p>
      <DataTable
        columns={columns}
        data={data}
        editable
        onCellUpdate={handleCellUpdate}
        showPagination={false}
        showColumnToggle={false}
      />
    </div>
  );
}

export const SingleEditableColumn = {
  name: 'Single Editable Column',
  render: () => <SingleEditableColumnExample />,
};

// ============================================================================
// All Cell Types
// ============================================================================

function AllCellTypesExample() {
  const [data, setData] = React.useState<Product[]>(initialProducts);

  const handleCellUpdate = (rowIndex: number, columnId: string, value: unknown) => {
    setData((prev) => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], [columnId]: value };
      return next;
    });
  };

  const columns: ColumnDef<Product, unknown>[] = [
    createEditableColumn<Product>('name', 'Product', {
      type: 'text',
      placeholder: 'Enter product name...',
    }),
    createEditableColumn<Product>('price', 'Price', {
      type: 'number',
      min: 0,
      max: 10000,
    }),
    createEditableColumn<Product>('category', 'Category', {
      type: 'select',
      options: [
        { value: 'accessories', label: 'Accessories' },
        { value: 'displays', label: 'Displays' },
        { value: 'peripherals', label: 'Peripherals' },
      ],
    }),
    createEditableColumn<Product>('restockDate', 'Restock Date', {
      type: 'date',
      placeholder: 'Pick date',
    }),
    createEditableColumn<Product>('inStock', 'In Stock', {
      type: 'checkbox',
    }),
  ];

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Each column uses a different cell type: text, number, select, date, and checkbox.
      </p>
      <DataTable
        columns={columns}
        data={data}
        editable
        onCellUpdate={handleCellUpdate}
        showPagination={false}
        showColumnToggle={false}
      />
    </div>
  );
}

export const AllCellTypes = {
  name: 'All Cell Types',
  render: () => <AllCellTypesExample />,
};

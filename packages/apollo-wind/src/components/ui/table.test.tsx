import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table';

describe('Table', () => {
  const TableExample = () => (
    <Table>
      <TableCaption>A list of recent invoices</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>INV001</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell>$250.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>INV002</TableCell>
          <TableCell>Pending</TableCell>
          <TableCell>$150.00</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell>$400.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );

  it('renders without crashing', () => {
    render(<TableExample />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<TableExample />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders table caption', () => {
    render(<TableExample />);
    expect(screen.getByText('A list of recent invoices')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<TableExample />);
    expect(screen.getByRole('columnheader', { name: 'Invoice' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Amount' })).toBeInTheDocument();
  });

  it('renders table body rows', () => {
    render(<TableExample />);
    expect(screen.getByText('INV001')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('$250.00')).toBeInTheDocument();
  });

  it('renders table footer', () => {
    render(<TableExample />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('$400.00')).toBeInTheDocument();
  });

  it('applies custom className to Table', () => {
    const { container } = render(
      <Table className="custom-table">
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const table = container.querySelector('table');
    expect(table).toHaveClass('custom-table');
  });

  it('applies custom className to TableHeader', () => {
    const { container } = render(
      <Table>
        <TableHeader className="custom-header">
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
      </Table>,
    );
    const thead = container.querySelector('thead');
    expect(thead).toHaveClass('custom-header');
  });

  it('applies custom className to TableBody', () => {
    const { container } = render(
      <Table>
        <TableBody className="custom-body">
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const tbody = container.querySelector('tbody');
    expect(tbody).toHaveClass('custom-body');
  });

  it('applies custom className to TableFooter', () => {
    const { container } = render(
      <Table>
        <TableFooter className="custom-footer">
          <TableRow>
            <TableCell>Footer</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );
    const tfoot = container.querySelector('tfoot');
    expect(tfoot).toHaveClass('custom-footer');
  });

  it('applies custom className to TableRow', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow className="custom-row">
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const row = container.querySelector('tr');
    expect(row).toHaveClass('custom-row');
  });

  it('applies custom className to TableHead', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="custom-head">Header</TableHead>
          </TableRow>
        </TableHeader>
      </Table>,
    );
    const head = screen.getByRole('columnheader');
    expect(head).toHaveClass('custom-head');
  });

  it('applies custom className to TableCell', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="custom-cell">Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const cell = screen.getByText('Cell');
    expect(cell).toHaveClass('custom-cell');
  });

  it('applies custom className to TableCaption', () => {
    render(
      <Table>
        <TableCaption className="custom-caption">Caption</TableCaption>
      </Table>,
    );
    const caption = screen.getByText('Caption');
    expect(caption).toHaveClass('custom-caption');
  });

  it('forwards ref correctly to Table', () => {
    const ref = { current: null };
    render(
      <Table ref={ref}>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(ref.current).toBeInstanceOf(HTMLTableElement);
  });

  it('forwards ref correctly to TableHeader', () => {
    const ref = { current: null };
    render(
      <Table>
        <TableHeader ref={ref}>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
      </Table>,
    );
    expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
  });

  it('forwards ref correctly to TableBody', () => {
    const ref = { current: null };
    render(
      <Table>
        <TableBody ref={ref}>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
  });

  it('forwards ref correctly to TableFooter', () => {
    const ref = { current: null };
    render(
      <Table>
        <TableFooter ref={ref}>
          <TableRow>
            <TableCell>Footer</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );
    expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
  });

  it('forwards ref correctly to TableRow', () => {
    const ref = { current: null };
    render(
      <Table>
        <TableBody>
          <TableRow ref={ref}>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(ref.current).toBeInstanceOf(HTMLTableRowElement);
  });

  it('forwards ref correctly to TableHead', () => {
    const ref = { current: null };
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead ref={ref}>Header</TableHead>
          </TableRow>
        </TableHeader>
      </Table>,
    );
    expect(ref.current).toBeInstanceOf(HTMLTableCellElement);
  });

  it('forwards ref correctly to TableCell', () => {
    const ref = { current: null };
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell ref={ref}>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(ref.current).toBeInstanceOf(HTMLTableCellElement);
  });

  it('forwards ref correctly to TableCaption', () => {
    const ref = { current: null };
    render(
      <Table>
        <TableCaption ref={ref}>Caption</TableCaption>
      </Table>,
    );
    expect(ref.current).toBeInstanceOf(HTMLTableCaptionElement);
  });

  it('supports colspan attribute', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell colSpan={3}>Spanning cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const cell = container.querySelector('td');
    expect(cell).toHaveAttribute('colSpan', '3');
  });

  it('supports rowSpan attribute', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell rowSpan={2}>Spanning cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const cell = container.querySelector('td');
    expect(cell).toHaveAttribute('rowSpan', '2');
  });

  it('renders in scrollable container', () => {
    const { container } = render(<TableExample />);
    const wrapper = container.querySelector('.overflow-auto');
    expect(wrapper).toBeInTheDocument();
  });

  it('supports selected row state', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow data-state="selected">
            <TableCell>Selected</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const row = container.querySelector('tr');
    expect(row).toHaveAttribute('data-state', 'selected');
  });
});

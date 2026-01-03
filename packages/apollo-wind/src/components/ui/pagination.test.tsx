import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './pagination';

describe('Pagination', () => {
  // Rendering tests
  describe('rendering', () => {
    it('renders pagination nav', () => {
      render(<Pagination />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('renders with aria-label', () => {
      render(<Pagination />);
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'pagination');
    });

    it('renders complete pagination structure', () => {
      render(
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
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  // Accessibility tests
  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
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
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('marks active page with aria-current', () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                2
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByText('2')).toHaveAttribute('aria-current', 'page');
    });

    it('has accessible labels on navigation links', () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
    });

    it('ellipsis has screen reader text', () => {
      render(<PaginationEllipsis />);
      expect(screen.getByText('More pages')).toBeInTheDocument();
    });

    it('ellipsis is hidden from accessibility tree', () => {
      const { container } = render(<PaginationEllipsis />);
      const ellipsis = container.firstChild;
      expect(ellipsis).toHaveAttribute('aria-hidden', 'true');
    });
  });

  // Props tests
  describe('PaginationLink', () => {
    it('applies active styles when isActive', () => {
      render(
        <PaginationLink href="#" isActive>
          1
        </PaginationLink>
      );
      const link = screen.getByText('1');
      expect(link).toHaveAttribute('aria-current', 'page');
    });

    it('does not have aria-current when not active', () => {
      render(<PaginationLink href="#">1</PaginationLink>);
      const link = screen.getByText('1');
      expect(link).not.toHaveAttribute('aria-current');
    });
  });

  // Ref forwarding tests
  describe('ref forwarding', () => {
    it('PaginationContent forwards ref', () => {
      const ref = createRef<HTMLUListElement>();
      render(<PaginationContent ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLUListElement);
    });

    it('PaginationItem forwards ref', () => {
      const ref = createRef<HTMLLIElement>();
      render(<PaginationItem ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLLIElement);
    });
  });

  // Custom className tests
  describe('custom className', () => {
    it('Pagination accepts custom className', () => {
      render(<Pagination className="custom-pagination" />);
      expect(screen.getByRole('navigation')).toHaveClass('custom-pagination');
    });

    it('PaginationContent accepts custom className', () => {
      const { container } = render(<PaginationContent className="custom-content" />);
      expect(container.firstChild).toHaveClass('custom-content');
    });

    it('PaginationItem accepts custom className', () => {
      const { container } = render(<PaginationItem className="custom-item" />);
      expect(container.firstChild).toHaveClass('custom-item');
    });

    it('PaginationLink accepts custom className', () => {
      render(
        <PaginationLink href="#" className="custom-link">
          1
        </PaginationLink>
      );
      expect(screen.getByText('1')).toHaveClass('custom-link');
    });

    it('PaginationEllipsis accepts custom className', () => {
      const { container } = render(<PaginationEllipsis className="custom-ellipsis" />);
      expect(container.firstChild).toHaveClass('custom-ellipsis');
    });
  });
});

import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

describe('Card', () => {
  it('renders card with all components', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Card Content</CardContent>
        <CardFooter>Card Footer</CardFooter>
      </Card>,
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
    expect(screen.getByText('Card Footer')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Accessible Card</CardTitle>
          <CardDescription>This card meets accessibility standards</CardDescription>
        </CardHeader>
        <CardContent>Content goes here</CardContent>
      </Card>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('applies custom className to Card', () => {
    const { container } = render(<Card className="custom-card">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('custom-card');
  });

  it('applies default border and shadow classes', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('border', 'shadow-sm');
  });

  it('forwards refs correctly', () => {
    const cardRef = { current: null };
    const headerRef = { current: null };

    render(
      <Card ref={cardRef}>
        <CardHeader ref={headerRef}>Header</CardHeader>
      </Card>,
    );

    expect(cardRef.current).toBeInstanceOf(HTMLDivElement);
    expect(headerRef.current).toBeInstanceOf(HTMLDivElement);
  });
});

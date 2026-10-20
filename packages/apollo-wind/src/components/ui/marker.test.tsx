import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Marker, MarkerContent, MarkerIcon, markerVariants } from './marker';

describe('Marker', () => {
  it('renders icon and content', () => {
    render(
      <Marker data-testid="marker">
        <MarkerIcon data-testid="icon">
          <svg aria-hidden="true" />
        </MarkerIcon>
        <MarkerContent>Today</MarkerContent>
      </Marker>
    );
    expect(screen.getByTestId('marker')).toHaveAttribute('data-slot', 'marker');
    expect(screen.getByTestId('marker')).toHaveAttribute('data-variant', 'default');
    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Today')).toHaveAttribute('data-slot', 'marker-content');
  });

  it.each(['default', 'separator', 'border'] as const)('applies the %s variant', (variant) => {
    render(
      <Marker data-testid="marker" variant={variant}>
        <MarkerContent>x</MarkerContent>
      </Marker>
    );
    expect(screen.getByTestId('marker')).toHaveAttribute('data-variant', variant);
    expect(screen.getByTestId('marker').className).toBe(markerVariants({ variant }));
  });

  it('renders as its child with asChild', () => {
    render(
      <Marker asChild>
        <section aria-label="System">
          <MarkerContent>x</MarkerContent>
        </section>
      </Marker>
    );
    const el = screen.getByLabelText('System');
    expect(el.tagName).toBe('SECTION');
    expect(el).toHaveAttribute('data-slot', 'marker');
  });

  it('forwards refs', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Marker ref={ref}>
        <MarkerContent>x</MarkerContent>
      </Marker>
    );
    expect(ref.current).toHaveAttribute('data-slot', 'marker');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Marker variant="separator">
        <MarkerContent>Today</MarkerContent>
      </Marker>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

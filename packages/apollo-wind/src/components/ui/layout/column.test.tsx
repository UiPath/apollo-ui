import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Column } from './column';

describe('Column', () => {
  it('renders children', () => {
    render(
      <Column>
        <span>Top</span>
        <span>Bottom</span>
      </Column>
    );
    expect(screen.getByText('Top')).toBeInTheDocument();
    expect(screen.getByText('Bottom')).toBeInTheDocument();
  });

  it('renders a flex container with column direction by default', () => {
    render(<Column data-testid="column">Content</Column>);
    expect(screen.getByTestId('column')).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
    });
  });

  it('supports overriding the direction', () => {
    render(
      <Column data-testid="column" direction="column-reverse">
        Content
      </Column>
    );
    expect(screen.getByTestId('column')).toHaveStyle({ flexDirection: 'column-reverse' });
  });

  it('maps align and justify props to flex styles', () => {
    render(
      <Column data-testid="column" align="stretch" justify="center">
        Content
      </Column>
    );
    expect(screen.getByTestId('column')).toHaveStyle({
      alignItems: 'stretch',
      justifyContent: 'center',
    });
  });

  it('maps gap to a rem value on the Tailwind scale', () => {
    render(
      <Column data-testid="column" gap={2}>
        Content
      </Column>
    );
    expect(screen.getByTestId('column')).toHaveStyle({ gap: '0.5rem' });
  });

  it('maps size and overflow props', () => {
    render(
      <Column data-testid="column" h="screen" minH={10} overflowY="auto">
        Content
      </Column>
    );
    expect(screen.getByTestId('column')).toHaveStyle({
      height: '100vw',
      minHeight: '2.5rem',
      overflowY: 'auto',
    });
  });

  it('maps padding and margin props to rem values', () => {
    render(
      <Column data-testid="column" py={4} mt={2}>
        Content
      </Column>
    );
    expect(screen.getByTestId('column')).toHaveStyle({
      paddingTop: '1rem',
      paddingBottom: '1rem',
      marginTop: '0.5rem',
    });
  });

  it('maps position prop', () => {
    render(
      <Column data-testid="column" position="relative">
        Content
      </Column>
    );
    expect(screen.getByTestId('column')).toHaveStyle({ position: 'relative' });
  });

  it('lets explicit style prop win over layout props', () => {
    render(
      <Column data-testid="column" gap={4} style={{ gap: '7px' }}>
        Content
      </Column>
    );
    expect(screen.getByTestId('column')).toHaveStyle({ gap: '7px' });
  });

  it('merges custom className', () => {
    render(
      <Column data-testid="column" className="custom-column">
        Content
      </Column>
    );
    expect(screen.getByTestId('column')).toHaveClass('custom-column');
  });

  it('forwards its ref to the rendered div', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Column ref={ref} data-testid="column">
        Content
      </Column>
    );
    expect(ref.current).toBe(screen.getByTestId('column'));
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Column gap={2}>
        <button type="button">Action</button>
        <span>Label</span>
      </Column>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

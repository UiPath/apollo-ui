import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Row } from './row';

describe('Row', () => {
  it('renders children', () => {
    render(
      <Row>
        <span>First</span>
        <span>Second</span>
      </Row>
    );
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('renders a flex container with row direction by default', () => {
    render(<Row data-testid="row">Content</Row>);
    expect(screen.getByTestId('row')).toHaveStyle({
      display: 'flex',
      flexDirection: 'row',
    });
  });

  it('supports overriding the direction', () => {
    render(
      <Row data-testid="row" direction="row-reverse">
        Content
      </Row>
    );
    expect(screen.getByTestId('row')).toHaveStyle({ flexDirection: 'row-reverse' });
  });

  it('maps align and justify props to flex styles', () => {
    render(
      <Row data-testid="row" align="center" justify="between">
        Content
      </Row>
    );
    expect(screen.getByTestId('row')).toHaveStyle({
      alignItems: 'center',
      justifyContent: 'space-between',
    });
  });

  it('maps gap to a rem value on the Tailwind scale', () => {
    render(
      <Row data-testid="row" gap={4}>
        Content
      </Row>
    );
    expect(screen.getByTestId('row')).toHaveStyle({ gap: '1rem' });
  });

  it('maps wrap and flex props', () => {
    render(
      <Row data-testid="row" wrap="wrap" flex={1}>
        Content
      </Row>
    );
    expect(screen.getByTestId('row')).toHaveStyle({ flexWrap: 'wrap', flex: '1' });
  });

  it('maps size props to CSS values', () => {
    render(
      <Row data-testid="row" w="full" h={8} maxW="50%">
        Content
      </Row>
    );
    expect(screen.getByTestId('row')).toHaveStyle({
      width: '100%',
      height: '2rem',
      maxWidth: '50%',
    });
  });

  it('maps padding and margin props to rem values', () => {
    render(
      <Row data-testid="row" p={2} mx={4}>
        Content
      </Row>
    );
    expect(screen.getByTestId('row')).toHaveStyle({
      padding: '0.5rem',
      marginLeft: '1rem',
      marginRight: '1rem',
    });
  });

  it('lets explicit style prop win over layout props', () => {
    render(
      <Row data-testid="row" gap={4} style={{ gap: '3px' }}>
        Content
      </Row>
    );
    expect(screen.getByTestId('row')).toHaveStyle({ gap: '3px' });
  });

  it('merges custom className', () => {
    render(
      <Row data-testid="row" className="custom-row">
        Content
      </Row>
    );
    expect(screen.getByTestId('row')).toHaveClass('custom-row');
  });

  it('forwards its ref to the rendered div', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Row ref={ref} data-testid="row">
        Content
      </Row>
    );
    expect(ref.current).toBe(screen.getByTestId('row'));
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Row gap={2} align="center">
        <button type="button">Action</button>
        <span>Label</span>
      </Row>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Column } from './Stack';

describe('Column', () => {
  it('renders children correctly', () => {
    render(
      <Column>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </Column>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('applies flex properties correctly', () => {
    render(
      <Column align="center" justify="space-between" gap={16} wrap="wrap">
        <div>Child</div>
      </Column>
    );

    const column = screen.getByText('Child').parentElement;
    expect(column).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      flexWrap: 'wrap',
    });
  });

  it('applies spacing properties correctly', () => {
    render(
      <Column p={16} m={8} px={4} py={2} mt={1} mb={2}>
        <div>Child</div>
      </Column>
    );

    const column = screen.getByText('Child').parentElement;
    expect(column).toHaveStyle({
      margin: '1px 8px 2px 8px',
      padding: '2px 4px 2px 4px',
    });
  });

  it('applies size properties correctly', () => {
    render(
      <Column w="100%" h={200} maxW={500} minW={200} maxH={300} minH={100}>
        <div>Child</div>
      </Column>
    );

    const column = screen.getByText('Child').parentElement;
    expect(column).toHaveStyle({
      width: '100%',
      height: '200px',
      maxWidth: '500px',
      minWidth: '200px',
      maxHeight: '300px',
      minHeight: '100px',
    });
  });

  it('applies overflow properties correctly', () => {
    render(
      <Column overflow="auto" overflowX="hidden" overflowY="scroll">
        <div>Child</div>
      </Column>
    );

    const column = screen.getByText('Child').parentElement;
    expect(column).toHaveStyle({
      overflow: 'auto',
      overflowX: 'hidden',
      overflowY: 'scroll',
    });
  });

  it('applies position property correctly', () => {
    render(
      <Column position="relative">
        <div>Child</div>
      </Column>
    );

    const column = screen.getByText('Child').parentElement;
    expect(column).toHaveStyle({
      position: 'relative',
    });
  });

  it('merges custom style with default styles', () => {
    const customStyle = { backgroundColor: 'rgb(255, 0, 0)' };
    render(
      <Column style={customStyle}>
        <div>Child</div>
      </Column>
    );

    const column = screen.getByText('Child').parentElement;
    expect(column).not.toBeNull();

    if (column) {
      const computedStyle = window.getComputedStyle(column);
      expect(computedStyle.display).toBe('flex');
      expect(computedStyle.flexDirection).toBe('column');
      expect(computedStyle.backgroundColor).toBe('rgb(255, 0, 0)');
    }
  });

  it('applies className correctly', () => {
    render(
      <Column className="test-class">
        <div>Child</div>
      </Column>
    );

    const column = screen.getByText('Child').parentElement;
    expect(column).toHaveClass('test-class');
  });

  it('handles string and number values for spacing props', () => {
    render(
      <Column p="20px" m={16} gap="1rem">
        <div>Child</div>
      </Column>
    );

    const column = screen.getByText('Child').parentElement;
    expect(column).toHaveStyle({
      padding: '20px',
      margin: '16px',
      gap: '1rem',
    });
  });
});

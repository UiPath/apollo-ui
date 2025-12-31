import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { ScrollArea } from './scroll-area';

describe('ScrollArea', () => {
  const ScrollAreaExample = () => (
    <ScrollArea className="h-[200px] w-[350px]">
      <div className="p-4">
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i}>Item {i + 1}</div>
        ))}
      </div>
    </ScrollArea>
  );

  it('renders without crashing', () => {
    const { container } = render(<ScrollAreaExample />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ScrollAreaExample />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders children content', () => {
    const { container } = render(<ScrollAreaExample />);
    expect(container.textContent).toContain('Item 1');
    expect(container.textContent).toContain('Item 50');
  });

  it('applies custom className', () => {
    const { container } = render(
      <ScrollArea className="custom-scroll">
        <div>Content</div>
      </ScrollArea>,
    );
    expect(container.firstChild).toHaveClass('custom-scroll');
  });

  it('applies overflow hidden class', () => {
    const { container } = render(<ScrollAreaExample />);
    expect(container.firstChild).toHaveClass('overflow-hidden');
  });

  it('forwards ref correctly to ScrollArea', () => {
    const ref = { current: null };
    render(
      <ScrollArea ref={ref}>
        <div>Content</div>
      </ScrollArea>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Bar, BarChart } from 'recharts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type ChartConfig, ChartContainer, ChartStyle } from './chart';

// recharts' ResponsiveContainer only renders its children once it has measured
// a non-zero size. jsdom never lays anything out, so we replace the global
// no-op ResizeObserver (from tests/setup.ts) with one that immediately reports
// a fixed size for any observed element.
class SizedResizeObserver {
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    const contentRect = {
      width: 400,
      height: 300,
      top: 0,
      left: 0,
      bottom: 300,
      right: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRectReadOnly;

    this.callback(
      [{ target, contentRect } as ResizeObserverEntry],
      this as unknown as ResizeObserver
    );
  }

  unobserve() {
    // no-op
  }

  disconnect() {
    // no-op
  }
}

const originalResizeObserver = global.ResizeObserver;

beforeAll(() => {
  global.ResizeObserver = SizedResizeObserver as unknown as typeof ResizeObserver;
});

afterAll(() => {
  global.ResizeObserver = originalResizeObserver;
});

const chartData = [
  { month: 'January', desktop: 186 },
  { month: 'February', desktop: 305 },
  { month: 'March', desktop: 237 },
];

const chartConfig: ChartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

const ChartExample = () => (
  <ChartContainer id="test" config={chartConfig} style={{ width: 400, height: 300 }}>
    <BarChart data={chartData}>
      <Bar dataKey="desktop" fill="var(--color-desktop)" />
    </BarChart>
  </ChartContainer>
);

describe('ChartContainer', () => {
  it('renders the chart container element', () => {
    const { container } = render(<ChartExample />);
    const chart = container.querySelector('[data-slot="chart"]');
    expect(chart).toBeInTheDocument();
  });

  it('sets a data-chart attribute derived from the id prop', () => {
    const { container } = render(<ChartExample />);
    const chart = container.querySelector('[data-slot="chart"]');
    expect(chart).toHaveAttribute('data-chart', 'chart-test');
  });

  it('generates a unique data-chart attribute when no id is given', () => {
    const { container } = render(
      <ChartContainer config={chartConfig} style={{ width: 400, height: 300 }}>
        <BarChart data={chartData}>
          <Bar dataKey="desktop" />
        </BarChart>
      </ChartContainer>
    );
    const chart = container.querySelector('[data-slot="chart"]');
    expect(chart?.getAttribute('data-chart')).toMatch(/^chart-/);
  });

  it('renders the responsive container and chart surface', () => {
    const { container } = render(<ChartExample />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    expect(container.querySelector('svg.recharts-surface')).toBeInTheDocument();
  });

  it('applies recharts styling classes and merges custom className', () => {
    const { container } = render(
      <ChartContainer
        id="classy"
        config={chartConfig}
        className="custom-chart"
        style={{ width: 400, height: 300 }}
      >
        <BarChart data={chartData}>
          <Bar dataKey="desktop" />
        </BarChart>
      </ChartContainer>
    );
    const chart = container.querySelector('[data-slot="chart"]');
    expect(chart).toHaveClass('custom-chart');
    expect(chart).toHaveClass('aspect-video');
  });

  it('emits CSS variables for configured series via ChartStyle', () => {
    const { container } = render(<ChartExample />);
    const style = container.querySelector('style');
    expect(style).toBeInTheDocument();
    expect(style?.textContent).toContain('--color-desktop: var(--chart-1);');
    expect(style?.textContent).toContain('[data-chart="chart-test"]');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div role="img" aria-label="Monthly desktop visits bar chart">
        <ChartExample />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('ChartStyle', () => {
  it('emits per-theme selectors and variables for theme-based config', () => {
    const themedConfig: ChartConfig = {
      revenue: {
        label: 'Revenue',
        theme: { light: '#111111', dark: '#eeeeee' },
      },
    };
    const { container } = render(<ChartStyle id="themed" config={themedConfig} />);
    const css = container.querySelector('style')?.textContent ?? '';

    expect(css).toContain(':is(.light, .light-hc, .future-light) [data-chart="themed"]');
    expect(css).toContain(
      ':is(.dark, .dark-hc, .future-dark, .wireframe, .vertex, .canvas) [data-chart="themed"]'
    );
    expect(css).toContain('--color-revenue: #111111;');
    expect(css).toContain('--color-revenue: #eeeeee;');
  });

  it('renders nothing when no config entry has a color or theme', () => {
    const { container } = render(
      <ChartStyle id="empty" config={{ desktop: { label: 'Desktop' } }} />
    );
    expect(container.querySelector('style')).not.toBeInTheDocument();
  });

  it('sanitizes unsafe characters out of ids and keys', () => {
    const { container } = render(
      <ChartStyle
        id='evil"]{}<script>'
        config={{ 'bad key!': { label: 'Bad', color: 'red' } }}
      />
    );
    const css = container.querySelector('style')?.textContent ?? '';
    expect(css).not.toContain('<script>');
    expect(css).toContain('--color-badkey: red;');
  });
});

describe('chart display', () => {
  it('renders bars for the provided data', () => {
    const { container } = render(<ChartExample />);
    const bars = container.querySelectorAll('.recharts-bar-rectangle');
    expect(bars.length).toBe(chartData.length);
  });

  it('is discoverable through screen queries when labelled', () => {
    render(
      <div role="img" aria-label="Desktop visits">
        <ChartExample />
      </div>
    );
    expect(screen.getByRole('img', { name: 'Desktop visits' })).toBeInTheDocument();
  });
});

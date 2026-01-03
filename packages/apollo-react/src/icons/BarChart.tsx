// Auto-generated from editor/bar-chart.svg
import React from 'react';

export interface BarChartProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BarChart = React.forwardRef<SVGSVGElement, BarChartProps>(
  ({ size, ...props }, ref) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...props}
      width={size ?? 24}
      height={size ?? 24}
    >
      <path d="M8 9H4V20H8V9Z" fill="currentColor" />
      <path d="M20 13H16V20H20V13Z" fill="currentColor" />
      <path d="M14 4H10V20H14V4Z" fill="currentColor" />
    </svg>
  )
);

BarChart.displayName = 'BarChart';

export default BarChart;

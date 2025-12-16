// Auto-generated from editor/show-chart.svg
import React from 'react';

export interface ShowChartProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ShowChart = React.forwardRef<SVGSVGElement, ShowChartProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M3.5 18.49L9.5 12.48L13.5 16.48L22 6.92001L20.59 5.51001L13.5 13.48L9.5 9.48001L2 16.99L3.5 18.49Z" fill="currentColor"/>
    </svg>
  )
);

ShowChart.displayName = 'ShowChart';

export default ShowChart;

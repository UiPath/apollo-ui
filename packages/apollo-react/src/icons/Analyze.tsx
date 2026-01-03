// Auto-generated from action/analyze.svg
import React from 'react';

export interface AnalyzeProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Analyze = React.forwardRef<SVGSVGElement, AnalyzeProps>(({ size, ...props }, ref) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    ref={ref}
    {...props}
    width={size ?? 24}
    height={size ?? 24}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.1133 20.7787H12.8912V3H11.1133V20.7787ZM7.55488 17.2231H9.33276V6.55586H7.55488V17.2231ZM5.77787 13.6671H4V10.1114H5.77787V13.6671ZM14.668 17.2232H16.4458V6.55591H14.668V17.2232ZM18.2227 13.6671V10.1113H20.0005V13.6671H18.2227Z"
      fill="currentColor"
    />
  </svg>
));

Analyze.displayName = 'Analyze';

export default Analyze;

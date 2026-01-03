// Auto-generated from action/tune.svg
import React from 'react';

export interface TuneProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Tune = React.forwardRef<SVGSVGElement, TuneProps>(({ size, ...props }, ref) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    ref={ref}
    {...props}
    width={size ?? 24}
    height={size ?? 24}
  >
    <rect x="17.5" y="14" width="2.5" height="2" fill="currentColor" />
    <circle cx="14" cy="15" r="2" fill="currentColor" />
    <rect x="4" y="14" width="6.5" height="2" fill="currentColor" />
    <rect x="13.5" y="8" width="6.5" height="2" fill="currentColor" />
    <rect x="4" y="8" width="2.5" height="2" fill="currentColor" />
    <circle cx="10" cy="9" r="2" fill="currentColor" />
  </svg>
));

Tune.displayName = 'Tune';

export default Tune;

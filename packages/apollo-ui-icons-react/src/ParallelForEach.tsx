// Auto-generated from logic/parallel-for-each.svg
import React from 'react';

export interface ParallelForEachProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ParallelForEach = React.forwardRef<SVGSVGElement, ParallelForEachProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M3 6V19H21V6H17V4L21.1 4C22.2458 4 23 4.99714 23 6V19C23 20.0029 22.2458 21 21.1 21H2.9C1.75416 21 1 20.0029 1 19V6C1 4.99714 1.75416 4 2.9 4H12V6H3Z" fill="currentColor"/>
<path d="M7 4L9.01 4L9.01 1L13 5L9.01 9L9.01 6L7 6L7 4Z" fill="currentColor"/>
<path d="M19 16V14L5 14V16L19 16Z" fill="currentColor"/>
<path d="M19 12V10L5 10V12L19 12Z" fill="currentColor"/>
    </svg>
  )
);

ParallelForEach.displayName = 'ParallelForEach';

export default ParallelForEach;

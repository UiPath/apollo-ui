// Auto-generated from action/step-out.svg
import React from 'react';

export interface StepOutProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const StepOut = React.forwardRef<SVGSVGElement, StepOutProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20ZM12 22C13.6569 22 15 20.6569 15 19C15 17.3431 13.6569 16 12 16C10.3431 16 9 17.3431 9 19C9 20.6569 10.3431 22 12 22Z" fill="currentColor"/>
<path d="M11 13L11 7L9.83 7L12 4.83L14.17 7L13 7L13 13L11 13ZM9 15L15 15L15 9L19 9L12 2L5 9L9 9L9 15Z" fill="currentColor"/>
    </svg>
  )
);

StepOut.displayName = 'StepOut';

export default StepOut;

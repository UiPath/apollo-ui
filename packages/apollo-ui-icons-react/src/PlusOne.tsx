// Auto-generated from social/plus-one.svg
import React from 'react';

export interface PlusOneProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const PlusOne = React.forwardRef<SVGSVGElement, PlusOneProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M10.5 8.5H8.5V12.5H4.5V14.5H8.5V18.5H10.5V14.5H14.5V12.5H10.5V8.5ZM15 6.58V8.4L17.5 7.9V18.5H19.5V5.5L15 6.58Z" fill="currentColor"/>
    </svg>
  )
);

PlusOne.displayName = 'PlusOne';

export default PlusOne;

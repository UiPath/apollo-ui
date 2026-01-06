// Auto-generated from editor/numbers.svg
import React from 'react';

export interface NumbersProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Numbers = React.forwardRef<SVGSVGElement, NumbersProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M20.5 10L21 8H17L18 4H16L15 8H11L12 4H10L9 8H5L4.5 10H8.5L7.5 14H3.5L3 16H7L6 20H8L9 16H13L12 20H14L15 16H19L19.5 14H15.5L16.5 10H20.5ZM13.5 14H9.5L10.5 10H14.5L13.5 14Z" fill="currentColor"/>
    </svg>
  )
);

Numbers.displayName = 'Numbers';

export default Numbers;
